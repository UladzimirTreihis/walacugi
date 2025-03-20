export default function getExcerpt(htmlString, length = 100) {
    // Remove HTML tags but keep line breaks
    const text = new DOMParser().parseFromString(htmlString, "text/html").body.textContent || "";
    
    // Ensure we don't cut off in the middle of a word
    if (text.length > length) {
      const cutIndex = text.lastIndexOf(" ", length); // Cut at last space within the limit
      return text.substring(0, cutIndex) + "...";
    }
    
    return text; // Return clean text
  };