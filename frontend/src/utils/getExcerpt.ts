export default function getExcerpt(htmlString: string, length = 100): string {
  const text =
    new DOMParser().parseFromString(htmlString, "text/html").body.textContent || "";
  if (text.length > length) {
    const cutIndex = text.lastIndexOf(" ", length);
    return text.substring(0, cutIndex) + "...";
  }
  return text;
}
