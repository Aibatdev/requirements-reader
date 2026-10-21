// The focused page can be either page of the visible spread.
export function currentSection(contents, page, selectedKey) {
  const selected = contents.find(item => item.key === selectedKey && item.page === page);
  return selected || contents.find(item => item.page === page) || [...contents].reverse().find(item => item.page < page) || contents[0];
}
