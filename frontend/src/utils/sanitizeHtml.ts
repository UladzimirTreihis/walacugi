import DOMPurify from "dompurify";

let hookRegistered = false;

function ensureSafeAnchorHook(): void {
  if (hookRegistered) return;
  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (!(node instanceof HTMLAnchorElement)) return;
    if (node.getAttribute("target") === "_blank") {
      node.setAttribute("rel", "noopener noreferrer");
    }
  });
  hookRegistered = true;
}

const ABOUT_ALLOWED_TAGS = ["a", "b", "i", "em", "strong", "p", "br", "ul", "ol", "li"];
const ABOUT_ALLOWED_ATTR = ["href", "target", "rel"];

export function sanitizeAboutHtml(html: string): string {
  ensureSafeAnchorHook();
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ABOUT_ALLOWED_TAGS,
    ALLOWED_ATTR: ABOUT_ALLOWED_ATTR
  });
}
