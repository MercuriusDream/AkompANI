import { beforeEach } from "vitest";
import "../../public/ide-runtime.js";

beforeEach(() => {
  if (window.localStorage && typeof window.localStorage.clear === "function") {
    window.localStorage.clear();
  }
  if (window.sessionStorage && typeof window.sessionStorage.clear === "function") {
    window.sessionStorage.clear();
  }
  window.AKOMPANI_IDE.ensureProviderAndReturn();
});
