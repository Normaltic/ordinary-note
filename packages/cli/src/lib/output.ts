/** --json이면 data를 JSON으로, 아니면 사람용 메시지를 출력한다 */
export function output(json: boolean | undefined, data: unknown, message: string): void {
  console.log(json ? JSON.stringify(data, null, 2) : message);
}
