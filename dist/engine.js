export function scoreAttempt(target, value, seconds) {
  const expected = Array.from(target);
  const typed = Array.from(value);
  const total = expected.length;
  const correct = expected.filter((char, index) => typed[index] === char).length;
  return { accuracy: total ? Math.round(correct / Math.max(total, typed.length) * 100) : 0, speed: seconds > 0 ? Math.round(correct * 60 / seconds) : 0, correct, total };
}

export function adviceFor(result) {
  if (result.accuracy < 80) return '先放慢速度，注意准确输入；遇到不熟悉的内容可以多练几次。';
  if (result.accuracy < 100) return '做得不错！再留意容易出错的位置，让输入更稳定。';
  return '这一关全部正确！继续保持稳定的节奏，慢慢挑战下一关。';
}

export function nextLevel(index, count) { return count > 0 ? (index + 1) % count : 0; }
