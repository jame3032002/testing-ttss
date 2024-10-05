function numberFormat(num: number) {
  return new Intl.NumberFormat().format(num);
}

function printColumnConsole(text: string, columnSpace = 14) {
  const messageArr = new Array(columnSpace - text.length).fill("\xa0");
  messageArr.unshift(text);
  const message = messageArr.join("");

  return message;
}

function boldMessage(msg: string) {
  return `\x1b[1m${msg}\x1b[0m`;
}

export { numberFormat, printColumnConsole, boldMessage };
