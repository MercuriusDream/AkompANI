/**
 * ScratchCanvas — Scratch-like jigsaw block visual programming engine.
 *
 * Drop-in replacement for Drawflow with a Drawflow-compatible API surface.
 * Blocks render as SVG paths with jigsaw notch/tab shapes. Blocks snap together
 * vertically. C-shaped blocks wrap child stacks (if, while, for_each, try_catch).
 *
 * Public API mirrors Drawflow:
 *   addNode, removeNodeId, getNodeFromId, addConnection, export, import, clear,
 *   zoom_in, zoom_out, zoom_reset, start, on, off
 *
 * Properties: zoom, precanvas, drawflow (for compat)
 */

class ScratchCanvas {
  /* ─── Shape constants ─── */
  static BLOCK_W = 260;
  static TAB_W = 20;
  static TAB_H = 12;
  static NOTCH_INSET = 24;
  static CORNER_R = 8;
  static HEADER_H = 34;
  static MIN_BODY_H = 10;
  static ARM_INDENT = 24;
  static ARM_MIN_H = 32;
  static ARM_BAR_H = 22;
  static SNAP_DIST = 28;

  /* ─── Block shape classification ─── */
  static HAT_TYPES = new Set(["start", "route_get", "route_post", "route_put", "route_delete"]);
  static CAP_TYPES = new Set(["end", "respond_json", "respond_html", "respond_redirect"]);
  static C_TYPES = new Set(["if", "switch_case", "while", "for_each", "try_catch"]);

  static C_ARM_COUNT = {
    if: 1,
    switch_case: 3,
    while: 1,
    for_each: 1,
    try_catch: 2,
  };

  /* ─── Constructor ─── */
  constructor(container) {
    this._container = container;
    this._nodes = new Map();
    this._connections = [];
    this._nextId = 1;
    this._listeners = {};
    this._zoom = 1;
    this._panX = 0;
    this._panY = 0;
    this._selectedId = null;
    this._dragState = null;
    this._isPanning = false;
    this._batchMode = false;
    this._lastSnapCheck = 0;

    // SVG setup
    this._svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this._svg.setAttribute("class", "scratch-svg");
    this._svg.setAttribute("width", "100%");
    this._svg.setAttribute("height", "100%");
    this._svg.style.position = "absolute";
    this._svg.style.inset = "0";
    this._svg.style.overflow = "visible";

    // Defs for filters + gradients
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    defs.innerHTML = `
      <filter id="scratchShadow" x="-10%" y="-10%" width="140%" height="140%">
        <feDropShadow dx="0" dy="1" stdDeviation="2.5" flood-opacity="0.10"/>
      </filter>
      <filter id="scratchGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#6366f1" flood-opacity="0.5"/>
      </filter>
    `;
    this._svg.appendChild(defs);

    // World group (pan + zoom transform)
    this._world = document.createElementNS("http://www.w3.org/2000/svg", "g");
    this._world.setAttribute("class", "scratch-world");
    this._svg.appendChild(this._world);

    // Connection lines layer
    this._connLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
    this._connLayer.setAttribute("class", "scratch-connections");
    this._world.appendChild(this._connLayer);

    // Blocks layer
    this._blockLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
    this._blockLayer.setAttribute("class", "scratch-blocks-layer");
    this._world.appendChild(this._blockLayer);

    // Snap preview element
    this._snapPreview = document.createElementNS("http://www.w3.org/2000/svg", "path");
    this._snapPreview.setAttribute("class", "scratch-snap-preview");
    this._snapPreview.setAttribute("fill", "none");
    this._snapPreview.setAttribute("stroke", "#6366f1");
    this._snapPreview.setAttribute("stroke-width", "3");
    this._snapPreview.setAttribute("stroke-dasharray", "6 3");
    this._snapPreview.setAttribute("opacity", "0");
    this._world.appendChild(this._snapPreview);

    container.appendChild(this._svg);

    // precanvas compat (Drawflow reads this for coordinate transforms)
    this.precanvas = this._svg;
  }

  /* ─── Lifecycle ─── */
  start() {
    this._bindEvents();
    this._updateTransform();
  }

  /* ─── Zoom property ─── */
  get zoom() { return this._zoom; }
  set zoom(v) { this._zoom = Math.max(0.1, Math.min(5, Number(v) || 1)); this._updateTransform(); }

  /* ─── Drawflow compat: drawflow.drawflow.Home.data ─── */
  get drawflow() {
    const data = {};
    for (const [id, node] of this._nodes) {
      data[id] = this._nodeToDrawflowFormat(node);
    }
    return { drawflow: { Home: { data } } };
  }

  /* ─── Event emitter ─── */
  on(event, fn) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(fn);
  }
  off(event, fn) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(f => f !== fn);
  }
  _emit(event, ...args) {
    (this._listeners[event] || []).forEach(fn => fn(...args));
  }

  /* ═══════════════════════════════════════════════════════════════════
     NODE MANAGEMENT
     ═══════════════════════════════════════════════════════════════════ */

  /**
   * addNode — Drawflow-compatible signature.
   * addNode(type, numInputs, numOutputs, x, y, className, data, html, extra)
   * Returns the new node's numeric ID.
   */
  addNode(type, numInputs, numOutputs, x, y, className, data, html, extra) {
    const id = this._nextId++;
    const node = {
      id,
      name: type,
      class: className || type,
      pos_x: x || 0,
      pos_y: y || 0,
      data: data ? JSON.parse(JSON.stringify(data)) : {},
      html: html || "",
      numInputs: numInputs || 0,
      numOutputs: numOutputs || 0,
      // Stack model
      next: null,       // ID of block snapped below
      prev: null,       // ID of block snapped above
      parentCBlock: null, // ID of C-block this is nested in
      branchIndex: -1,    // Which arm of the C-block
      branches: ScratchCanvas.C_TYPES.has(type)
        ? Array.from({ length: ScratchCanvas.C_ARM_COUNT[type] || 1 }, () => null)
        : null,
      // Computed layout
      _totalH: 0,
      _armHeights: null,
    };

    this._nodes.set(id, node);
    this._renderNode(id);
    return id;
  }

  /**
   * getNodeFromId — returns node object (Drawflow format for compat).
   * Note: returns a deep-cloned data object for safety. Use updateNodeDataFromId to persist changes.
   */
  getNodeFromId(id) {
    const nid = Number(id);
    const node = this._nodes.get(nid);
    if (!node) return null;
    return this._nodeToDrawflowFormat(node);
  }

  /**
   * updateNodeDataFromId — update data on a node (Drawflow-compatible).
   */
  updateNodeDataFromId(id, data) {
    const nid = Number(id);
    const node = this._nodes.get(nid);
    if (!node) return;
    node.data = data ? JSON.parse(JSON.stringify(data)) : {};
  }

  /**
   * removeNodeId — accepts "node-{id}" string or numeric ID.
   */
  removeNodeId(idArg) {
    let nid;
    if (typeof idArg === "string" && idArg.startsWith("node-")) {
      nid = Number(idArg.slice(5));
    } else if (typeof idArg === "string" && idArg.startsWith("snode-")) {
      nid = Number(idArg.slice(6));
    } else {
      nid = Number(idArg);
    }
    const node = this._nodes.get(nid);
    if (!node) return;

    // Reconnect prev→next around this node before detaching
    const prevId = node.prev;
    const nextId = node.next;

    // Detach from stack (clears node.prev, parent.next, parentCBlock etc.)
    this._detachNode(nid);

    // Also clear the node's own .next so _detachNode's chain-walk doesn't follow
    node.next = null;

    // Reconnect: if this node had a prev and a next, link them together
    if (prevId && nextId) {
      const prevNode = this._nodes.get(prevId);
      const nextNode = this._nodes.get(nextId);
      if (prevNode && nextNode) {
        prevNode.next = nextId;
        nextNode.prev = prevId;
      }
    } else if (nextId) {
      // This node was the first in a C-block arm — promote next to branch head
      const nextNode = this._nodes.get(nextId);
      if (nextNode) nextNode.prev = null;
      // If this node was the head of a C-block branch, re-assign the branch
      if (node.parentCBlock !== null) {
        const parent = this._nodes.get(node.parentCBlock);
        if (parent && parent.branches) {
          const bi = node.branchIndex;
          if (bi >= 0 && bi < parent.branches.length) {
            parent.branches[bi] = nextId;
            nextNode.parentCBlock = node.parentCBlock;
            nextNode.branchIndex = bi;
          }
        }
      }
    }

    // Remove C-block branch children (orphan them as free stacks)
    if (node.branches) {
      for (let bi = 0; bi < node.branches.length; bi++) {
        const childId = node.branches[bi];
        if (childId) {
          const childNode = this._nodes.get(childId);
          if (childNode) {
            childNode.parentCBlock = null;
            childNode.branchIndex = -1;
          }
        }
      }
    }

    // Remove connections involving this node
    this._connections = this._connections.filter(
      c => c.sourceId !== nid && c.targetId !== nid
    );

    // Remove DOM
    const el = document.getElementById(`snode-${nid}`);
    if (el) el.remove();

    this._nodes.delete(nid);
    this._renderConnections();

    // Reposition affected stacks
    if (prevId) {
      const root = this._findStackRoot(prevId);
      this._updateBlockPath(root);
    }

    if (this._selectedId === nid) {
      this._selectedId = null;
      this._emit("nodeUnselected");
    }
  }

  /* ═══════════════════════════════════════════════════════════════════
     CONNECTIONS
     ═══════════════════════════════════════════════════════════════════ */

  addConnection(sourceId, targetId, sourcePort, targetPort) {
    const sid = Number(sourceId);
    const tid = Number(targetId);
    if (!this._nodes.has(sid) || !this._nodes.has(tid)) return;

    // Avoid duplicates
    const exists = this._connections.some(
      c => c.sourceId === sid && c.targetId === tid && c.sourcePort === sourcePort && c.targetPort === targetPort
    );
    if (exists) return;

    this._connections.push({
      sourceId: sid,
      targetId: tid,
      sourcePort: sourcePort || "output_1",
      targetPort: targetPort || "input_1",
    });

    // Auto-snap if they're close and not already stacked
    this._tryAutoSnap(sid, tid, sourcePort);

    // Reposition stack so snapped blocks are visually connected
    const sourceNode = this._nodes.get(sid);
    if (sourceNode && (sourceNode.next === tid || (sourceNode.branches && sourceNode.branches.includes(tid)))) {
      this._repositionStack(this._findStackRoot(sid));
    }

    // Defer render if in batch mode (e.g. during import)
    if (!this._batchMode) {
      this._renderConnections();
    }
    this._emit("connectionCreated", {
      output_id: sid,
      input_id: tid,
      output_class: sourcePort,
      input_class: targetPort,
    });
  }

  removeConnection(sourceId, targetId, sourcePort, targetPort) {
    const sid = Number(sourceId);
    const tid = Number(targetId);
    this._connections = this._connections.filter(
      c => !(c.sourceId === sid && c.targetId === tid && c.sourcePort === sourcePort && c.targetPort === targetPort)
    );
    this._renderConnections();
    this._emit("connectionRemoved", {
      output_id: sid,
      input_id: tid,
      output_class: sourcePort,
      input_class: targetPort,
    });
  }

  /* ═══════════════════════════════════════════════════════════════════
     SERIALIZATION (Drawflow-compatible)
     ═══════════════════════════════════════════════════════════════════ */

  export() {
    const data = {};
    for (const [id, node] of this._nodes) {
      data[id] = this._nodeToDrawflowFormat(node);
    }
    return { drawflow: { Home: { data } } };
  }

  import(drawflowData) {
    this.clear();

    // Normalize various formats
    let data = null;
    if (drawflowData?.drawflow?.Home?.data) {
      data = drawflowData.drawflow.Home.data;
    } else if (drawflowData?.Home?.data) {
      data = drawflowData.Home.data;
    } else if (drawflowData?.drawflow?.drawflow?.Home?.data) {
      data = drawflowData.drawflow.drawflow.Home.data;
    }
    if (!data) return;

    // Rebuild nodes
    let maxId = 0;
    for (const [idStr, nd] of Object.entries(data)) {
      const id = Number(idStr);
      if (id > maxId) maxId = id;

      const node = {
        id,
        name: nd.name || nd.class || "unknown",
        class: nd.class || nd.name || "unknown",
        pos_x: nd.pos_x || 0,
        pos_y: nd.pos_y || 0,
        data: nd.data ? JSON.parse(JSON.stringify(nd.data)) : {},
        html: nd.html || "",
        numInputs: Object.keys(nd.inputs || {}).length,
        numOutputs: Object.keys(nd.outputs || {}).length,
        next: null,
        prev: null,
        parentCBlock: null,
        branchIndex: -1,
        branches: ScratchCanvas.C_TYPES.has(nd.name)
          ? Array.from({ length: ScratchCanvas.C_ARM_COUNT[nd.name] || 1 }, () => null)
          : null,
        _totalH: 0,
        _armHeights: null,
      };
      this._nodes.set(id, node);
    }
    this._nextId = maxId + 1;

    // Rebuild connections from input/output data
    for (const [idStr, nd] of Object.entries(data)) {
      const sourceId = Number(idStr);
      const outputs = nd.outputs || {};
      for (const [portKey, portVal] of Object.entries(outputs)) {
        for (const conn of portVal.connections || []) {
          this._connections.push({
            sourceId,
            targetId: Number(conn.node),
            sourcePort: portKey,
            targetPort: conn.input || conn.output || "input_1",
          });
        }
      }
    }

    // Auto-snap stacks based on spatial proximity & connections
    this._batchMode = true;
    this._autoSnapFromConnections();
    this._batchMode = false;

    // Render everything
    for (const id of this._nodes.keys()) {
      this._renderNode(id);
    }
    this._renderConnections();
  }

  clear() {
    this._nodes.clear();
    this._connections = [];
    this._nextId = 1;
    this._selectedId = null;
    this._dragState = null;
    this._isPanning = false;
    this._panX = 0;
    this._panY = 0;
    this._zoom = 1;
    this._updateTransform();
    // Clear SVG
    while (this._blockLayer.firstChild) this._blockLayer.firstChild.remove();
    while (this._connLayer.firstChild) this._connLayer.firstChild.remove();
  }

  load() {
    // Drawflow compat: re-render
    for (const id of this._nodes.keys()) {
      this._renderNode(id);
    }
    this._renderConnections();
  }

  /* ═══════════════════════════════════════════════════════════════════
     ZOOM
     ═══════════════════════════════════════════════════════════════════ */

  zoom_in() {
    this._zoom = Math.min(3, this._zoom + 0.1);
    this._updateTransform();
    this._emit("zoom", this._zoom);
  }

  zoom_out() {
    this._zoom = Math.max(0.2, this._zoom - 0.1);
    this._updateTransform();
    this._emit("zoom", this._zoom);
  }

  zoom_reset() {
    this._zoom = 1;
    this._updateTransform();
    this._emit("zoom", this._zoom);
  }

  _updateTransform() {
    this._world.setAttribute("transform",
      `translate(${this._panX},${this._panY}) scale(${this._zoom})`
    );
  }

  /* ═══════════════════════════════════════════════════════════════════
     SVG PATH GENERATORS — Jigsaw shapes
     ═══════════════════════════════════════════════════════════════════ */

  /**
   * Generate notch path segment (top of block — indentation).
   * Draws from left to right across the top edge.
   */
  static _notchTop(x, w) {
    const ni = ScratchCanvas.NOTCH_INSET;
    const tw = ScratchCanvas.TAB_W;
    const th = ScratchCanvas.TAB_H;
    // Smooth U-shaped scoop using cubic beziers
    return `h ${ni} c 0,0 0,${th} ${tw / 2},${th} c ${tw / 2},0 ${tw / 2},${-th} ${tw / 2},${-th} h ${w - ni - tw}`;
  }

  /**
   * Generate tab path segment (bottom of block — protrusion).
   * Draws from right to left across the bottom edge.
   */
  static _tabBottom(x, w) {
    const ni = ScratchCanvas.NOTCH_INSET;
    const tw = ScratchCanvas.TAB_W;
    const th = ScratchCanvas.TAB_H;
    // Smooth bump protrusion using cubic beziers (right-to-left)
    return `h ${-(w - ni - tw)} c 0,0 0,${th} ${-tw / 2},${th} c ${-tw / 2},0 ${-tw / 2},${-th} ${-tw / 2},${-th} h ${-ni}`;
  }

  /**
   * Hat block path — rounded top, no notch, tab on bottom.
   */
  static hatPath(w, h) {
    const r = ScratchCanvas.CORNER_R;
    return [
      `M 0 ${r}`,
      `a ${r} ${r} 0 0 1 ${r} ${-r}`,
      `h ${w - 2 * r}`,
      `a ${r} ${r} 0 0 1 ${r} ${r}`,
      `v ${h - 2 * r}`,
      `a ${r} ${r} 0 0 1 ${-r} ${r}`,
      ScratchCanvas._tabBottom(0, w - 2 * r),
      `a ${r} ${r} 0 0 1 ${-r} ${-r}`,
      `Z`
    ].join(" ");
  }

  /**
   * Cap block path — notch on top, flat bottom, no tab.
   */
  static capPath(w, h) {
    const r = ScratchCanvas.CORNER_R;
    return [
      `M 0 ${r}`,
      `a ${r} ${r} 0 0 1 ${r} ${-r}`,
      ScratchCanvas._notchTop(0, w - 2 * r),
      `a ${r} ${r} 0 0 1 ${r} ${r}`,
      `v ${h - 2 * r}`,
      `a ${r} ${r} 0 0 1 ${-r} ${r}`,
      `h ${-(w - 2 * r)}`,
      `a ${r} ${r} 0 0 1 ${-r} ${-r}`,
      `Z`
    ].join(" ");
  }

  /**
   * Stack block path — notch on top + tab on bottom.
   */
  static stackPath(w, h) {
    const r = ScratchCanvas.CORNER_R;
    return [
      `M 0 ${r}`,
      `a ${r} ${r} 0 0 1 ${r} ${-r}`,
      ScratchCanvas._notchTop(0, w - 2 * r),
      `a ${r} ${r} 0 0 1 ${r} ${r}`,
      `v ${h - 2 * r}`,
      `a ${r} ${r} 0 0 1 ${-r} ${r}`,
      ScratchCanvas._tabBottom(0, w - 2 * r),
      `a ${r} ${r} 0 0 1 ${-r} ${-r}`,
      `Z`
    ].join(" ");
  }

  /**
   * C-block path — notch top, C-arm(s) wrapping children, tab on bottom.
   * armHeights: array of pixel heights for each arm cavity.
   */
  static cBlockPath(w, h, armHeights = [32]) {
    return ScratchCanvas._cBlockPathAbsolute(
      w,
      ScratchCanvas.HEADER_H,
      armHeights,
      ScratchCanvas.ARM_BAR_H
    );
  }

  /**
   * C-block path using absolute coordinates with rounded corners + smooth bezier notches/tabs.
   */
  static _cBlockPathAbsolute(w, hdrH, armHeights, barH) {
    const indent = ScratchCanvas.ARM_INDENT;
    const ni = ScratchCanvas.NOTCH_INSET;
    const tw = ScratchCanvas.TAB_W;
    const th = ScratchCanvas.TAB_H;
    const r = ScratchCanvas.CORNER_R;
    const ri = Math.min(r, 4); // Inner arm corner radius

    let y = 0;
    const d = [];

    // --- Top-left rounded corner ---
    d.push(`M 0,${y + r}`);
    d.push(`A ${r} ${r} 0 0 1 ${r},${y}`);

    // --- Top edge: smooth notch ---
    d.push(`L ${ni},${y}`);
    d.push(`C ${ni},${y} ${ni},${y + th} ${ni + tw / 2},${y + th}`);
    d.push(`C ${ni + tw},${y + th} ${ni + tw},${y} ${ni + tw},${y}`);

    // --- Top-right rounded corner ---
    d.push(`L ${w - r},${y}`);
    d.push(`A ${r} ${r} 0 0 1 ${w},${y + r}`);

    // --- Right side: down to first arm ---
    y += hdrH;
    d.push(`L ${w},${y}`);

    for (let i = 0; i < armHeights.length; i++) {
      const armH = Math.max(ScratchCanvas.ARM_MIN_H, armHeights[i]);

      // --- Arm opening: go left with rounded inner corner ---
      d.push(`L ${indent + ri},${y}`);
      d.push(`A ${ri} ${ri} 0 0 0 ${indent},${y + ri}`);

      // --- Inner arm notch (smooth bezier) ---
      const ny = y + ri; // notch Y after corner
      d.push(`L ${indent + ni},${ny}`);
      d.push(`C ${indent + ni},${ny} ${indent + ni},${ny + th} ${indent + ni + tw / 2},${ny + th}`);
      d.push(`C ${indent + ni + tw},${ny + th} ${indent + ni + tw},${ny} ${indent + ni + tw},${ny}`);

      // --- Back out to right edge ---
      d.push(`L ${w},${ny}`);

      // --- Go down the arm cavity ---
      y += armH;
      d.push(`L ${w},${y}`);

      // --- Arm bottom: step back to indent with rounded corner ---
      d.push(`L ${indent + ri},${y}`);
      d.push(`A ${ri} ${ri} 0 0 0 ${indent},${y + ri}`);

      // --- Arm bar (separator) ---
      y += barH;
      d.push(`L ${indent},${y - ri}`);
      d.push(`A ${ri} ${ri} 0 0 0 ${indent + ri},${y}`);

      if (i < armHeights.length - 1) {
        // Inter-arm: go back to full width for next arm
        d.push(`L ${w},${y}`);
      }
    }

    // --- Bottom edge: go out to full width ---
    d.push(`L ${w - r},${y}`);
    d.push(`A ${r} ${r} 0 0 1 ${w},${y + r}`);

    // Small bottom section
    const bottomH = r * 2;
    y += bottomH;
    d.push(`L ${w},${y - r}`);
    d.push(`A ${r} ${r} 0 0 1 ${w - r},${y}`);

    // --- Bottom tab (smooth bezier protrusion) ---
    d.push(`L ${ni + tw},${y}`);
    d.push(`C ${ni + tw},${y} ${ni + tw},${y + th} ${ni + tw / 2},${y + th}`);
    d.push(`C ${ni},${y + th} ${ni},${y} ${ni},${y}`);

    // --- Bottom-left rounded corner ---
    d.push(`L ${r},${y}`);
    d.push(`A ${r} ${r} 0 0 1 0,${y - r}`);

    d.push(`Z`);

    return d.join(" ");
  }

  /**
   * Calculate total block height based on type and content.
   * Uses _calcVisiting set for infinite recursion prevention.
   */
  _calcBlockHeight(id, _visited) {
    const node = this._nodes.get(id);
    if (!node) return 0;

    // Cycle guard
    const visited = _visited || new Set();
    if (visited.has(id)) return ScratchCanvas.HEADER_H + ScratchCanvas.MIN_BODY_H;
    visited.add(id);

    const el = document.getElementById(`snode-${id}`);
    const foBody = el?.querySelector(".scratch-block");
    const hdr = ScratchCanvas.HEADER_H;
    let bodyH = ScratchCanvas.MIN_BODY_H;

    if (foBody) {
      // Measure actual HTML content height
      const rect = foBody.getBoundingClientRect();
      if (rect.height > 0) {
        bodyH = Math.max(bodyH, (rect.height / (this._zoom || 1)) - hdr);
      }
    }

    if (ScratchCanvas.C_TYPES.has(node.name)) {
      const armHeights = this._calcArmHeights(id, visited);
      node._armHeights = armHeights;
      const totalArms = armHeights.reduce((s, h) => s + h + ScratchCanvas.ARM_BAR_H, 0);
      const cHdrH = Math.max(hdr, hdr + bodyH); // Full content height for C-block header
      node._cHeaderH = cHdrH;
      node._totalH = cHdrH + totalArms;
    } else {
      node._totalH = hdr + bodyH;
    }

    return node._totalH;
  }

  /**
   * Calculate arm heights for a C-block based on nested children.
   */
  _calcArmHeights(id, _visited) {
    const node = this._nodes.get(id);
    if (!node || !node.branches) return [ScratchCanvas.ARM_MIN_H];

    const visited = _visited || new Set();

    return node.branches.map(firstChildId => {
      if (!firstChildId) return ScratchCanvas.ARM_MIN_H;
      let h = 0;
      let cur = firstChildId;
      let safety = 500;
      while (cur && safety-- > 0) {
        const child = this._nodes.get(cur);
        if (!child) break;
        h += this._calcBlockHeight(cur, visited);
        cur = child.next;
      }
      return Math.max(ScratchCanvas.ARM_MIN_H, h);
    });
  }

  /* ═══════════════════════════════════════════════════════════════════
     BLOCK RENDERING
     ═══════════════════════════════════════════════════════════════════ */

  _renderNode(id) {
    const node = this._nodes.get(id);
    if (!node) return;

    // Remove existing
    const existing = document.getElementById(`snode-${id}`);
    if (existing) existing.remove();

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("id", `snode-${id}`);
    g.setAttribute("class", `scratch-node${this._selectedId === id ? " selected" : ""}`);
    g.setAttribute("transform", `translate(${node.pos_x},${node.pos_y})`);
    g.dataset.nodeId = id;

    const w = ScratchCanvas.BLOCK_W;

    // Parse color from HTML or use default
    const colorMatch = node.html?.match(/--node-color:\s*([#\w]+)/);
    const color = colorMatch ? colorMatch[1] : "#888";

    // Shape path
    const shape = this._getShapeType(node.name);
    let bodyH;

    // Create main shape path — neutral card fill (CSS sets actual color via class)
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("class", "scratch-shape");
    path.setAttribute("fill", "var(--scratch-card-bg, #f5f7fb)");
    path.setAttribute("stroke", "var(--scratch-card-border, rgba(0,0,0,0.10))");
    path.setAttribute("stroke-width", "1");
    path.setAttribute("filter", "url(#scratchShadow)");
    g.appendChild(path);

    // Clip accent stripe to the exact block shape so it never protrudes above rounded hats.
    const accentClip = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
    accentClip.setAttribute("id", `scratch-accent-clip-${id}`);
    accentClip.setAttribute("clipPathUnits", "userSpaceOnUse");
    const accentClipPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    accentClipPath.setAttribute("class", "scratch-accent-clip-path");
    accentClip.appendChild(accentClipPath);
    g.appendChild(accentClip);

    // Left accent bar — colored stripe on left edge (inset by 1px to not cover selection stroke)
    const accent = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    accent.setAttribute("class", "scratch-accent");
    accent.setAttribute("x", "1");
    accent.setAttribute("y", "1");
    accent.setAttribute("width", "3");
    accent.setAttribute("height", "400"); // refined by _updateBlockPath
    accent.setAttribute("rx", "0");
    accent.setAttribute("fill", color);
    accent.setAttribute("opacity", "0.82");
    accent.setAttribute("pointer-events", "none");
    accent.setAttribute("clip-path", `url(#scratch-accent-clip-${id})`);
    g.appendChild(accent);

    // ForeignObject for HTML content
    const fo = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
    fo.setAttribute("x", "0");
    fo.setAttribute("y", "0");
    fo.setAttribute("width", w);
    fo.setAttribute("height", "400"); // Initial estimate, refined by _updateBlockPath

    const foBody = document.createElement("div");
    foBody.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
    foBody.className = "scratch-fo-body";
    foBody.style.width = w + "px";
    foBody.innerHTML = ScratchCanvas._sanitizeHtml(node.html || "");

    fo.appendChild(foBody);
    g.appendChild(fo);

    this._blockLayer.appendChild(g);

    // Measure & set final path
    requestAnimationFrame(() => {
      this._updateBlockPath(id);
    });
  }

  _updateBlockPath(id) {
    const node = this._nodes.get(id);
    if (!node) return;
    const g = document.getElementById(`snode-${id}`);
    if (!g) return;

    const w = ScratchCanvas.BLOCK_W;
    const shape = this._getShapeType(node.name);

    // Measure content
    const foBody = g.querySelector(".scratch-fo-body");
    let contentH = ScratchCanvas.HEADER_H + ScratchCanvas.MIN_BODY_H;
    if (foBody) {
      const block = foBody.querySelector(".scratch-block");
      if (block) {
        contentH = block.offsetHeight > 0 ? block.offsetHeight : contentH;
      }
    }

    let pathD;
    let totalH = contentH;

    switch (shape) {
      case "hat":
        pathD = ScratchCanvas.hatPath(w, contentH);
        break;
      case "cap":
        pathD = ScratchCanvas.capPath(w, contentH);
        break;
      case "c-block": {
        const armHeights = this._calcArmHeights(id);
        node._armHeights = armHeights;
        // Use measured content height as header so arms start below all HTML content
        const cHdrH = Math.max(ScratchCanvas.HEADER_H, contentH);
        node._cHeaderH = cHdrH;
        pathD = ScratchCanvas._cBlockPathAbsolute(w, cHdrH, armHeights, ScratchCanvas.ARM_BAR_H);
        const bottomSection = ScratchCanvas.CORNER_R * 2;
        totalH = cHdrH + armHeights.reduce((s, h) => s + h + ScratchCanvas.ARM_BAR_H, 0) + bottomSection;
        break;
      }
      default:
        pathD = ScratchCanvas.stackPath(w, contentH);
        break;
    }

    node._totalH = totalH;

    const pathEl = g.querySelector(".scratch-shape");
    if (pathEl) pathEl.setAttribute("d", pathD);
    const accentClipPathEl = g.querySelector(".scratch-accent-clip-path");
    if (accentClipPathEl) accentClipPathEl.setAttribute("d", pathD);

    // Update accent bar height (inset by 1px top+bottom to not cover selection stroke)
    const accentEl = g.querySelector(".scratch-accent");
    if (accentEl) {
      accentEl.setAttribute("height", String(Math.max(0, totalH - 2)));
    }

    // Update foreignObject height
    const fo = g.querySelector("foreignObject");
    if (fo) fo.setAttribute("height", totalH + 20);

    // C-block: add/update arm cavity backgrounds
    g.querySelectorAll(".scratch-arm-bg").forEach(el => el.remove());
    if (shape === "c-block" && node._armHeights) {
      const indent = ScratchCanvas.ARM_INDENT;
      const ri = Math.min(ScratchCanvas.CORNER_R, 4);
      let armY = (node._cHeaderH || ScratchCanvas.HEADER_H) + ri;
      for (let i = 0; i < node._armHeights.length; i++) {
        const armH = Math.max(ScratchCanvas.ARM_MIN_H, node._armHeights[i]) - ri;
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("class", "scratch-arm-bg");
        rect.setAttribute("x", indent);
        rect.setAttribute("y", armY);
        rect.setAttribute("width", w - indent);
        rect.setAttribute("height", armH);
        rect.setAttribute("rx", ri);
        rect.setAttribute("fill", "var(--scratch-arm-cavity, rgba(0,0,0,0.06))");
        rect.setAttribute("pointer-events", "none");
        // Insert after the main shape path but before foreignObject
        const foEl = g.querySelector("foreignObject");
        if (foEl) g.insertBefore(rect, foEl);
        else g.appendChild(rect);
        armY += armH + ri + ScratchCanvas.ARM_BAR_H;
      }
    }

    // Update stacked positions
    this._repositionStack(id);
    this._renderConnections();
  }

  _getShapeType(type) {
    if (ScratchCanvas.HAT_TYPES.has(type)) return "hat";
    if (ScratchCanvas.CAP_TYPES.has(type)) return "cap";
    if (ScratchCanvas.C_TYPES.has(type)) return "c-block";
    return "stack";
  }

  /* ═══════════════════════════════════════════════════════════════════
     STACK MANAGEMENT
     ═══════════════════════════════════════════════════════════════════ */

  /**
   * Snap nodeB below nodeA (nodeB's top notch into nodeA's bottom tab).
   */
  _snapBelow(aboveId, belowId) {
    const above = this._nodes.get(aboveId);
    const below = this._nodes.get(belowId);
    if (!above || !below) return;

    // Detach below from its current stack first
    if (below.prev) {
      const prevNode = this._nodes.get(below.prev);
      if (prevNode) prevNode.next = null;
    }
    if (below.parentCBlock !== null) {
      const parent = this._nodes.get(below.parentCBlock);
      if (parent && parent.branches) {
        const bi = below.branchIndex;
        if (bi >= 0 && parent.branches[bi] === belowId) {
          parent.branches[bi] = null;
        }
      }
    }

    // If above already had a next, insert below between them
    const oldNext = above.next;
    above.next = belowId;
    below.prev = aboveId;

    // Propagate parentCBlock/branchIndex to entire below chain
    let cur = belowId;
    let safety = 500;
    while (cur && safety-- > 0) {
      const n = this._nodes.get(cur);
      if (!n) break;
      n.parentCBlock = above.parentCBlock;
      n.branchIndex = above.branchIndex;
      if (!n.next) {
        // This is the tail — connect old next here
        if (oldNext) {
          n.next = oldNext;
          const oldNextNode = this._nodes.get(oldNext);
          if (oldNextNode) oldNextNode.prev = cur;
        }
        break;
      }
      cur = n.next;
    }

    this._repositionStack(this._findStackRoot(aboveId));
  }

  /**
   * Snap a block as the first child of a C-block arm.
   */
  _snapIntoCArm(cBlockId, branchIndex, childId) {
    const cBlock = this._nodes.get(cBlockId);
    const child = this._nodes.get(childId);
    if (!cBlock || !child || !cBlock.branches) return;

    // Detach child from current position
    this._detachNode(childId);

    const oldFirst = cBlock.branches[branchIndex];
    cBlock.branches[branchIndex] = childId;
    child.prev = null;
    child.parentCBlock = cBlockId;
    child.branchIndex = branchIndex;

    // Append old first child after the new child's chain
    if (oldFirst) {
      let tail = childId;
      while (this._nodes.get(tail)?.next) {
        tail = this._nodes.get(tail).next;
      }
      const tailNode = this._nodes.get(tail);
      if (tailNode) {
        tailNode.next = oldFirst;
        const oldNode = this._nodes.get(oldFirst);
        if (oldNode) oldNode.prev = tail;
      }
    }

    this._repositionStack(this._findStackRoot(cBlockId));
    this._updateBlockPath(cBlockId);
  }

  /**
   * Detach a node from its stack (keep the chain below it).
   * Also clears parentCBlock/branchIndex on the detached node and its children.
   */
  _detachNode(id) {
    const node = this._nodes.get(id);
    if (!node) return;

    // Unlink from prev — splice prev→node.next if needed
    if (node.prev) {
      const prevNode = this._nodes.get(node.prev);
      if (prevNode) prevNode.next = null;
      node.prev = null;
    }

    // Unlink from C-block parent
    if (node.parentCBlock !== null) {
      const parent = this._nodes.get(node.parentCBlock);
      if (parent && parent.branches) {
        const bi = node.branchIndex;
        if (bi >= 0 && parent.branches[bi] === id) {
          parent.branches[bi] = null;
        }
      }
      // Clear parentCBlock/branchIndex on this node AND the chain below it
      this._clearParentRefs(id);
    }
  }

  /**
   * Clear parentCBlock & branchIndex on a node and all nodes chained below it.
   */
  _clearParentRefs(id) {
    let cur = id;
    let safety = 500;
    while (cur && safety-- > 0) {
      const n = this._nodes.get(cur);
      if (!n) break;
      n.parentCBlock = null;
      n.branchIndex = -1;
      cur = n.next;
    }
  }

  /**
   * Find the root of a stack chain.
   */
  _findStackRoot(id) {
    let cur = id;
    let safety = 200;
    while (safety-- > 0) {
      const node = this._nodes.get(cur);
      if (!node) return cur;
      if (node.prev) {
        cur = node.prev;
      } else if (node.parentCBlock !== null) {
        cur = node.parentCBlock;
      } else {
        return cur;
      }
    }
    return cur;
  }

  /**
   * Reposition all blocks in a stack starting from root.
   */
  _repositionStack(rootId) {
    const root = this._nodes.get(rootId);
    if (!root) return;

    this._positionChain(rootId, root.pos_x, root.pos_y);
  }

  _positionChain(id, x, y, _visited) {
    const node = this._nodes.get(id);
    if (!node) return y;

    // Cycle guard
    const visited = _visited || new Set();
    if (visited.has(id)) return y;
    visited.add(id);

    node.pos_x = x;
    node.pos_y = y;
    const g = document.getElementById(`snode-${id}`);
    if (g) g.setAttribute("transform", `translate(${x},${y})`);

    let nextY = y + (node._totalH != null ? node._totalH : ScratchCanvas.HEADER_H + ScratchCanvas.MIN_BODY_H);

    // Position C-block children inside arms
    if (node.branches) {
      const cHdrH = node._cHeaderH || ScratchCanvas.HEADER_H;
      let armY = y + cHdrH;
      for (let i = 0; i < node.branches.length; i++) {
        const firstChild = node.branches[i];
        if (firstChild) {
          this._positionChain(firstChild, x + ScratchCanvas.ARM_INDENT, armY, visited);
        }
        const armH = node._armHeights && node._armHeights[i] != null ? node._armHeights[i] : ScratchCanvas.ARM_MIN_H;
        armY += armH + ScratchCanvas.ARM_BAR_H;
      }
      nextY = armY;
    }

    // Position next block in chain
    if (node.next) {
      this._positionChain(node.next, x, nextY, visited);
    }

    return nextY;
  }

  /* ═══════════════════════════════════════════════════════════════════
     CONNECTION RENDERING (lines between non-stacked blocks)
     ═══════════════════════════════════════════════════════════════════ */

  _renderConnections() {
    while (this._connLayer.firstChild) this._connLayer.firstChild.remove();

    for (const conn of this._connections) {
      const source = this._nodes.get(conn.sourceId);
      const target = this._nodes.get(conn.targetId);
      if (!source || !target) continue;

      // Skip rendering connection line if blocks are snapped together
      if (source.next === conn.targetId) continue;
      // Skip if target is first child in a C-block arm of source
      if (source.branches && source.branches.includes(conn.targetId)) continue;

      const sourceH = source._totalH != null ? source._totalH : ScratchCanvas.HEADER_H;
      const sx = source.pos_x + ScratchCanvas.BLOCK_W / 2;
      const sy = source.pos_y + sourceH;
      const tx = target.pos_x + ScratchCanvas.BLOCK_W / 2;
      const ty = target.pos_y;

      const midY = (sy + ty) / 2;
      const pathD = `M ${sx} ${sy} C ${sx} ${midY}, ${tx} ${midY}, ${tx} ${ty}`;

      const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
      line.setAttribute("d", pathD);
      line.setAttribute("fill", "none");
      line.setAttribute("stroke", "#94a2b8");
      line.setAttribute("stroke-width", "2");
      line.setAttribute("stroke-dasharray", "6 3");
      line.setAttribute("opacity", "0.5");
      this._connLayer.appendChild(line);
    }
  }

  /* ═══════════════════════════════════════════════════════════════════
     AUTO-SNAP FROM CONNECTIONS (during import)
     ═══════════════════════════════════════════════════════════════════ */

  _autoSnapFromConnections() {
    // First pass: output_1 connections (the primary "next" chain)
    for (const conn of this._connections) {
      if (conn.sourcePort === "output_1" && conn.targetPort === "input_1") {
        this._tryAutoSnap(conn.sourceId, conn.targetId, conn.sourcePort);
      }
    }
    // Second pass: C-block branch connections (output_2, output_3, etc.)
    for (const conn of this._connections) {
      if (conn.sourcePort !== "output_1" && conn.targetPort === "input_1") {
        this._tryAutoSnap(conn.sourceId, conn.targetId, conn.sourcePort);
      }
    }
  }

  _tryAutoSnap(sourceId, targetId, sourcePort) {
    const source = this._nodes.get(sourceId);
    const target = this._nodes.get(targetId);
    if (!source || !target) return;

    // For output_1 → input_1: snap target below source
    if (sourcePort === "output_1" && !source.next && !target.prev) {
      source.next = targetId;
      target.prev = sourceId;
    }

    // For C-block branching outputs (output_2, output_3, etc.)
    // output_1 is always "next" (below snap). output_2 → branch[0], output_3 → branch[1], etc.
    if (source.branches && sourcePort !== "output_1") {
      const portNum = parseInt(sourcePort.replace("output_", ""), 10);
      const bi = portNum - 2; // output_2 → branch[0], output_3 → branch[1]
      if (bi >= 0 && bi < source.branches.length && !source.branches[bi] && !target.prev && target.parentCBlock === null) {
        source.branches[bi] = targetId;
        target.parentCBlock = sourceId;
        target.branchIndex = bi;
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════
     INTERACTION — Pan, Select, Drag & Snap
     ═══════════════════════════════════════════════════════════════════ */

  _bindEvents() {
    // Mouse events
    this._svg.addEventListener("mousedown", this._onMouseDown.bind(this));
    this._svg.addEventListener("mousemove", this._onMouseMove.bind(this));
    this._svg.addEventListener("mouseup", this._onMouseUp.bind(this));
    this._svg.addEventListener("wheel", this._onWheel.bind(this), { passive: false });

    // Touch events (PWA support)
    this._svg.addEventListener("touchstart", (e) => {
      if (e.touches.length === 1) {
        const t = e.touches[0];
        const target = document.elementFromPoint(t.clientX, t.clientY) || this._svg;
        this._onMouseDown({ clientX: t.clientX, clientY: t.clientY, target, preventDefault: () => e.preventDefault() });
      }
    }, { passive: false });
    this._svg.addEventListener("touchmove", (e) => {
      if (e.touches.length === 1) {
        const t = e.touches[0];
        const target = document.elementFromPoint(t.clientX, t.clientY) || this._svg;
        this._onMouseMove({ clientX: t.clientX, clientY: t.clientY, target, preventDefault: () => e.preventDefault() });
      }
    }, { passive: false });
    this._svg.addEventListener("touchend", (e) => {
      this._onMouseUp({ preventDefault: () => {} });
    });

    // Prevent drag interference for inputs inside foreignObject
    this._svg.addEventListener("mousedown", (e) => {
      const tag = e.target.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select" || tag === "button") {
        e.stopPropagation();
      }
    }, true);

    // Click delegation for scratch-block actions
    this._svg.addEventListener("click", (e) => {
      const actionBtn = e.target.closest("[data-action]");
      if (actionBtn) {
        const action = actionBtn.dataset.action;
        const nodeG = e.target.closest(".scratch-node");
        const nodeId = nodeG ? Number(nodeG.dataset.nodeId) : null;
        if (action === "delete" && nodeId) {
          this.removeNodeId(nodeId);
        }
        if (action === "duplicate" && nodeId) {
          this._duplicateNode(nodeId);
        }
      }
    });

    // Input/change delegation for inline fields
    this._svg.addEventListener("input", (e) => {
      this._handleFieldChange(e);
    }, true);
    this._svg.addEventListener("change", (e) => {
      this._handleFieldChange(e);
    }, true);
  }

  _handleFieldChange(e) {
    const nodeG = e.target.closest(".scratch-node");
    if (!nodeG) return;
    const nodeId = Number(nodeG.dataset.nodeId);
    const node = this._nodes.get(nodeId);
    if (!node) return;

    const fieldKey = e.target.dataset?.fieldKey;
    if (!fieldKey) return;

    // Update node data directly
    node.data[fieldKey] = e.target.type === "number" ? Number(e.target.value) : e.target.value;

    // Emit event so external code (app.js) can react
    this._emit("nodeDataChanged", nodeId, fieldKey, node.data[fieldKey]);
  }

  _clientToCanvas(clientX, clientY) {
    const rect = this._svg.getBoundingClientRect();
    const z = this._zoom || 1;
    return {
      x: (clientX - rect.left - this._panX) / z,
      y: (clientY - rect.top - this._panY) / z,
    };
  }

  _onMouseDown(e) {
    const target = e?.target || this._svg;
    // Don't intercept form elements
    const tag = target.tagName?.toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select" || tag === "button") return;

    const nodeG = target.closest ? target.closest(".scratch-node") : null;

    if (nodeG) {
      // Start dragging a block
      const nodeId = Number(nodeG.dataset.nodeId);
      const node = this._nodes.get(nodeId);
      if (!node) return;

      // Select this node
      if (this._selectedId !== nodeId) {
        const prevSelected = this._selectedId;
        this._selectedId = nodeId;

        if (prevSelected) {
          const prevG = document.getElementById(`snode-${prevSelected}`);
          if (prevG) prevG.classList.remove("selected");
          this._emit("nodeUnselected");
        }

        nodeG.classList.add("selected");
        this._emit("nodeSelected", nodeId);
      }

      const canvas = this._clientToCanvas(e.clientX, e.clientY);
      this._dragState = {
        nodeId,
        startX: canvas.x,
        startY: canvas.y,
        origX: node.pos_x,
        origY: node.pos_y,
        moved: false,
        detached: false,
      };

      e.preventDefault();
    } else {
      // Deselect
      if (this._selectedId) {
        const prevG = document.getElementById(`snode-${this._selectedId}`);
        if (prevG) prevG.classList.remove("selected");
        this._selectedId = null;
        this._emit("nodeUnselected");
      }

      // Start panning
      this._isPanning = true;
      this._panStartX = e.clientX;
      this._panStartY = e.clientY;
      this._panOrigX = this._panX;
      this._panOrigY = this._panY;
      this._svg.style.cursor = "grabbing";
      e.preventDefault();
    }
  }

  _onMouseMove(e) {
    if (this._isPanning) {
      const dx = e.clientX - this._panStartX;
      const dy = e.clientY - this._panStartY;
      this._panX = this._panOrigX + dx;
      this._panY = this._panOrigY + dy;
      this._updateTransform();
      return;
    }

    if (!this._dragState) return;

    const canvas = this._clientToCanvas(e.clientX, e.clientY);
    const dx = canvas.x - this._dragState.startX;
    const dy = canvas.y - this._dragState.startY;

    if (!this._dragState.moved && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
      this._dragState.moved = true;

      // Detach from stack if needed
      if (!this._dragState.detached) {
        this._detachNode(this._dragState.nodeId);
        this._dragState.detached = true;
      }
    }

    if (!this._dragState.moved) return;

    const node = this._nodes.get(this._dragState.nodeId);
    if (!node) return;

    const newX = this._dragState.origX + dx;
    const newY = this._dragState.origY + dy;

    // Move the entire chain
    this._moveChain(this._dragState.nodeId, newX, newY);

    // Check snap targets (throttled to every 50ms for perf)
    const now = performance.now();
    if (!this._lastSnapCheck || now - this._lastSnapCheck > 50) {
      this._lastSnapCheck = now;
      this._checkSnapPreview(this._dragState.nodeId);
    }
  }

  _onMouseUp(e) {
    if (this._isPanning) {
      this._isPanning = false;
      this._svg.style.cursor = "";
      return;
    }

    if (!this._dragState) return;

    const ds = this._dragState;
    this._dragState = null;

    if (ds.moved) {
      // Try to snap
      const snapTarget = this._findSnapTarget(ds.nodeId);
      const dragNode = this._nodes.get(ds.nodeId);
      if (snapTarget && dragNode) {
        // Hat blocks cannot be snapped below other blocks or into C-arms
        const isHat = ScratchCanvas.HAT_TYPES.has(dragNode.name);
        if (snapTarget.type === "below" && !isHat) {
          this._snapBelow(snapTarget.targetId, ds.nodeId);
        } else if (snapTarget.type === "c-arm" && !isHat) {
          this._snapIntoCArm(snapTarget.targetId, snapTarget.branchIndex, ds.nodeId);
        }
        this._emit("connectionCreated", {
          output_id: snapTarget.targetId,
          input_id: ds.nodeId,
        });
      }

      this._hideSnapPreview();
      this._emit("nodeMoved", ds.nodeId);
    }
  }

  _onWheel(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    const newZoom = Math.max(0.2, Math.min(3, this._zoom + delta));

    // Zoom toward mouse position
    const rect = this._svg.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const ratio = newZoom / (this._zoom || 1);
    this._panX = mx - (mx - this._panX) * ratio;
    this._panY = my - (my - this._panY) * ratio;

    this._zoom = newZoom;
    this._updateTransform();
    this._emit("zoom", this._zoom);
  }

  _moveChain(id, x, y, _visited) {
    const node = this._nodes.get(id);
    if (!node) return;

    // Cycle guard
    const visited = _visited || new Set();
    if (visited.has(id)) return;
    visited.add(id);

    node.pos_x = x;
    node.pos_y = y;
    const g = document.getElementById(`snode-${id}`);
    if (g) g.setAttribute("transform", `translate(${x},${y})`);

    // Move children in stack
    let nextY = y + (node._totalH != null ? node._totalH : ScratchCanvas.HEADER_H);

    // C-block arm children
    if (node.branches) {
      const cHdrH = node._cHeaderH || ScratchCanvas.HEADER_H;
      let armY = y + cHdrH;
      for (let i = 0; i < node.branches.length; i++) {
        if (node.branches[i]) {
          this._moveChain(node.branches[i], x + ScratchCanvas.ARM_INDENT, armY, visited);
        }
        const armH = node._armHeights?.[i] != null ? node._armHeights[i] : ScratchCanvas.ARM_MIN_H;
        armY += armH + ScratchCanvas.ARM_BAR_H;
      }
    }

    if (node.next) {
      this._moveChain(node.next, x, nextY, visited);
    }
  }

  /* ═══════════════════════════════════════════════════════════════════
     SNAP DETECTION
     ═══════════════════════════════════════════════════════════════════ */

  _findSnapTarget(dragId) {
    const dragNode = this._nodes.get(dragId);
    if (!dragNode) return null;

    const dragX = dragNode.pos_x;
    const dragY = dragNode.pos_y;
    const dist = ScratchCanvas.SNAP_DIST;

    let best = null;
    let bestDist = dist;

    for (const [id, node] of this._nodes) {
      if (id === dragId) continue;
      // Don't snap to blocks that are in the drag chain
      if (this._isInChain(id, dragId)) continue;

      const nodeH = node._totalH != null ? node._totalH : ScratchCanvas.HEADER_H;

      // Check snap below this node (can't snap below cap blocks)
      if (!node.next && !ScratchCanvas.CAP_TYPES.has(node.name)) {
        const tabX = node.pos_x;
        const tabY = node.pos_y + nodeH;
        const d = Math.hypot(dragX - tabX, dragY - tabY);
        if (d < bestDist) {
          bestDist = d;
          best = { type: "below", targetId: id, x: tabX, y: tabY };
        }
      }

      // Check snap into C-block arms
      if (node.branches) {
        const cHdrH = node._cHeaderH || ScratchCanvas.HEADER_H;
        let armY = node.pos_y + cHdrH;
        for (let bi = 0; bi < node.branches.length; bi++) {
          if (!node.branches[bi]) {
            const armX = node.pos_x + ScratchCanvas.ARM_INDENT;
            const d = Math.hypot(dragX - armX, dragY - armY);
            if (d < bestDist) {
              bestDist = d;
              best = { type: "c-arm", targetId: id, branchIndex: bi, x: armX, y: armY };
            }
          }
          const armH = node._armHeights?.[bi] != null ? node._armHeights[bi] : ScratchCanvas.ARM_MIN_H;
          armY += armH + ScratchCanvas.ARM_BAR_H;
        }
      }
    }

    return best;
  }

  /**
   * Check if checkId is anywhere in the tree rooted at chainStartId
   * (follows .next chains AND C-block branches to prevent cycles).
   */
  _isInChain(checkId, chainStartId) {
    const visited = new Set();
    const stack = [chainStartId];
    while (stack.length > 0) {
      const cur = stack.pop();
      if (cur == null || visited.has(cur)) continue;
      if (cur === checkId) return true;
      visited.add(cur);
      const node = this._nodes.get(cur);
      if (!node) continue;
      if (node.next) stack.push(node.next);
      if (node.branches) {
        for (const branchHead of node.branches) {
          if (branchHead) stack.push(branchHead);
        }
      }
    }
    return false;
  }

  _checkSnapPreview(dragId) {
    const target = this._findSnapTarget(dragId);
    if (target) {
      this._showSnapPreview(target);
    } else {
      this._hideSnapPreview();
    }
  }

  _showSnapPreview(target) {
    const w = ScratchCanvas.BLOCK_W;
    const x = target.x || 0;
    const y = target.y || 0;

    // Draw a ghostly notch shape at the snap point
    const ni = ScratchCanvas.NOTCH_INSET;
    const tw = ScratchCanvas.TAB_W;
    const th = ScratchCanvas.TAB_H;

    const d = [
      `M ${x},${y}`,
      `L ${x + ni},${y}`,
      `L ${x + ni + tw / 4},${y + th}`,
      `L ${x + ni + tw * 3 / 4},${y + th}`,
      `L ${x + ni + tw},${y}`,
      `L ${x + w},${y}`,
    ].join(" ");

    this._snapPreview.setAttribute("d", d);
    this._snapPreview.setAttribute("opacity", "0.7");
  }

  _hideSnapPreview() {
    this._snapPreview.setAttribute("opacity", "0");
  }

  /* ═══════════════════════════════════════════════════════════════════
     UTILITY
     ═══════════════════════════════════════════════════════════════════ */

  _duplicateNode(id) {
    const node = this._nodes.get(id);
    if (!node) return;
    const newId = this.addNode(
      node.name,
      node.numInputs,
      node.numOutputs,
      node.pos_x + 30,
      node.pos_y + 30,
      node.class,
      JSON.parse(JSON.stringify(node.data)),
      node.html,
      false
    );
    return newId;
  }

  _nodeToDrawflowFormat(node) {
    // Build inputs/outputs in Drawflow format
    const inputs = {};
    for (let i = 1; i <= node.numInputs; i++) {
      const portKey = `input_${i}`;
      const conns = this._connections
        .filter(c => c.targetId === node.id && c.targetPort === portKey)
        .map(c => ({ node: String(c.sourceId), input: c.sourcePort }));
      inputs[portKey] = { connections: conns };
    }

    const outputs = {};
    for (let i = 1; i <= node.numOutputs; i++) {
      const portKey = `output_${i}`;
      const conns = this._connections
        .filter(c => c.sourceId === node.id && c.sourcePort === portKey)
        .map(c => ({ node: String(c.targetId), output: c.targetPort }));
      outputs[portKey] = { connections: conns };
    }

    return {
      id: node.id,
      name: node.name,
      data: JSON.parse(JSON.stringify(node.data)),
      class: node.class,
      html: node.html,
      typenode: false,
      inputs,
      outputs,
      pos_x: node.pos_x,
      pos_y: node.pos_y,
    };
  }

  /* ═══════════════════════════════════════════════════════════════════
     HTML SANITIZATION
     ═══════════════════════════════════════════════════════════════════ */

  /**
   * Sanitize HTML to prevent XSS from imported flows.
   * Strips executable elements/attributes and dangerous protocols after entity decoding.
   */
  static _sanitizeHtml(html) {
    if (!html) return "";
    const template = document.createElement("template");
    template.innerHTML = String(html);
    const decodeContainer = document.createElement("textarea");
    const urlAttributes = new Set([
      "href",
      "src",
      "action",
      "xlink:href",
      "formaction",
      "poster",
      "background",
      "cite",
      "longdesc",
    ]);

    const isDangerousHeader = (name) => {
      const lowered = String(name || "").toLowerCase();
      return lowered === "__proto__" || lowered === "constructor" || lowered === "prototype";
    };

    const decodeEntities = (value) => {
      decodeContainer.innerHTML = String(value || "");
      return decodeContainer.value;
    };

    const hasDangerousProtocol = (value) => {
      const normalized = decodeEntities(value).replace(/[\u0000-\u001F\u007F\s]+/g, "").toLowerCase();
      return (
        normalized.startsWith("javascript:") ||
        normalized.startsWith("data:") ||
        normalized.startsWith("vbscript:") ||
        normalized.startsWith("file:")
      );
    };

    const hasDangerousSrcset = (value) => {
      const decoded = decodeEntities(value);
      return decoded
        .split(",")
        .map((entry) => entry.trim().split(/\s+/)[0] || "")
        .some((candidate) => hasDangerousProtocol(candidate));
    };

    const enforceNoopener = (el) => {
      if (String(el.getAttribute("target") || "").toLowerCase() !== "_blank") return;
      const relTokens = new Set(
        String(el.getAttribute("rel") || "")
          .split(/\s+/)
          .map((token) => token.trim().toLowerCase())
          .filter(Boolean),
      );
      relTokens.add("noopener");
      relTokens.add("noreferrer");
      el.setAttribute("rel", Array.from(relTokens).join(" "));
    };

    template.content
      .querySelectorAll("script, iframe, object, embed, form, meta, link, base, style")
      .forEach((node) => node.remove());

    for (const el of template.content.querySelectorAll("*")) {
      for (const attr of Array.from(el.attributes)) {
        const attrName = String(attr.name || "");
        const lowered = attrName.toLowerCase();
        if (isDangerousHeader(lowered)) {
          el.removeAttribute(attrName);
          continue;
        }

        if (lowered.startsWith("on")) {
          el.removeAttribute(attrName);
          continue;
        }

        if (lowered === "srcdoc") {
          el.removeAttribute(attrName);
          continue;
        }

        if (lowered === "style") {
          const normalizedStyle = String(attr.value || "").replace(/\s+/g, "").toLowerCase();
          if (
            normalizedStyle.includes("expression(") ||
            normalizedStyle.includes("url(") ||
            normalizedStyle.includes("javascript:")
          ) {
            el.removeAttribute(attrName);
          }
          continue;
        }

        if (lowered === "srcset" && hasDangerousSrcset(attr.value)) {
          el.removeAttribute(attrName);
          continue;
        }

        if (urlAttributes.has(lowered) && hasDangerousProtocol(attr.value)) {
          if (lowered === "href") {
            el.setAttribute("href", "#");
          } else {
            el.removeAttribute(attrName);
          }
        }
      }
      enforceNoopener(el);
    }

    return template.innerHTML;
  }

  /* ═══════════════════════════════════════════════════════════════════
     EXTERNAL DRAG & DROP (from palette)
     ═══════════════════════════════════════════════════════════════════ */

  /**
   * Get canvas coordinates from a client-space event (for palette drop).
   */
  clientToCanvasCoords(clientX, clientY) {
    return this._clientToCanvas(clientX, clientY);
  }

  /**
   * Move a node to a specific position and reposition its stack.
   */
  moveNodeTo(id, x, y) {
    const nid = Number(id);
    const node = this._nodes.get(nid);
    if (!node) return;
    node.pos_x = x;
    node.pos_y = y;
    const g = document.getElementById(`snode-${nid}`);
    if (g) g.setAttribute("transform", `translate(${x},${y})`);
    this._repositionStack(this._findStackRoot(nid));
    this._renderConnections();
  }
}

// Make available globally
window.ScratchCanvas = ScratchCanvas;
