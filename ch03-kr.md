# 03 장: 순수 함수와 순수한 기쁨을

## 한번 더 순수함에 대하여

순수 함수라는 개념을 확실하게 짚고 넘어갈 필요가 있습니다.

> 순수 함수(Pure function)란 부수효과(side effect)가 없고, 동일한 입력에 대해 항상 동일한 출력을 반환하는 함수입니다.

`slice`와 `splice`를 비교해 봅시다. 둘은 비슷해 보이지만 완전히 다른 방식으로 동작합니다. 우리는 `slice`가 동일한 입력에 대해 항상 동일한 출력을 내놓기 때문에 **순수**하다고 부릅니다. 반면 `splice`는 원본 배열을 직접 수정하여 영구적인 변경을 일으키므로 관측 가능한 부수효과를 만듭니다.

```js
const xs = [1, 2, 3, 4, 5];

// 순수 (Pure)
xs.slice(0, 3); // [1,2,3]
xs.slice(0, 3); // [1,2,3]
xs.slice(0, 3); // [1,2,3]

// 비순수 (Impure)
xs.splice(0, 3); // [1,2,3]
xs.splice(0, 3); // [4,5]
xs.splice(0, 3); // []
```

함수형 프로그래밍에서는 `splice`처럼 원본 데이터를 직접 수정하여 예측하기 어렵게 만드는 함수를 피합니다. 매번 신뢰할 수 있는 동일한 결과를 내놓는 순수 함수를 작성하고자 하기 때문입니다.

다른 예를 볼까요?

```js
// 비순수
let minimum = 21;
const checkAge = (age) => age >= minimum;

// 순수
const checkAge = (age) => {
  const minimum = 21;
  return age >= minimum;
};
```

순수하지 않은 버전의 `checkAge`는 결과를 결정할 때 외부의 가변 변수인 `minimum`에 의존합니다. 즉, 함수의 실행이 시스템의 외부 상태에 의존하며, 이는 외부 환경까지 신경 써야 하는 인지 부하(cognitive load)를 증가시킵니다.

이 예제에서는 사소해 보일지 모르지만, 외부 상태에 의존하는 것은 시스템 복잡성을 증가시키는 가장 큰 원인 중 하나입니다. `checkAge`는 입력값뿐만 아니라 외부 요인에 의해 다른 결과를 낼 수 있으며, 이는 소프트웨어의 동작을 추론하기 어렵게 만듭니다.

반면 순수한 형태의 함수는 완전히 독립적(self-sufficient)입니다. 외부 변수를 사용할 때도 불변 객체로 만들어 사용하면 순수성을 해치지 않습니다:

```js
const immutableState = Object.freeze({ minimum: 21 });
```

## 부수효과는 ...를 포함할 수 있어요

부수효과(side effect)에 대해 좀 더 깊이 알아봅시다. **순수 함수**의 정의에서 말하는 사악한 **부수효과**란 정확히 무엇일까요? 우리는 계산 과정에서 단순히 결과값을 만들어내는 것 외의 모든 외부 상호작용을 **효과(effect)**라고 부릅니다.

효과 자체가 본질적으로 나쁜 것은 아닙니다. 우리는 이후의 장에서도 효과를 계속 다룰 것입니다. 부정적인 의미가 담긴 것은 바로 **부수(side)**라는 수식어입니다. 물만 있다고 모기가 번식하지는 않습니다. **고여 있는** 물이 번식처가 되듯, 통제되지 않는 부수효과가 프로그램의 버그를 양산합니다.

> **부수효과**란 계산 도중에 시스템의 상태를 변경하거나 외부 환경과 **관측 가능한 상호작용**을 하는 것을 의미합니다.

부수효과에는 다음과 같은 것들이 포함됩니다:

- 파일 시스템 수정하기
- 데이터베이스에 레코드 삽입/수정하기
- HTTP 네트워크 요청 보내기
- 가변 상태 변이 (mutations)
- 화면 출력 및 콘솔 로깅
- 사용자 입력 받기
- DOM 쿼리 및 조작
- 시스템 전역 상태에 접근하기

함수 외부 세계와 상호작용하는 모든 것이 부수효과입니다. 이런 것들 없이 어떻게 쓸모 있는 프로그램을 만들 수 있을지 의아할 것입니다. 함수형 프로그래밍은 부수효과를 무조건 금지하는 것이 아니라, 이를 격리하고 통제 가능한 환경 안에서 안전하게 다루는 것을 목표로 합니다. 나중에 펑터와 모나드를 배우면서 이를 다루는 방법을 배우게 될 것입니다.

## 중학교 2학년 수학

수학에서 정의하는 함수를 떠올려 봅시다:

> 함수란 입력과 출력 사이의 특별한 관계입니다:
> 각 입력에 대해 단 하나의 출력이 대응됩니다.

다시 말해 함수는 입력과 출력 간의 일대일 대응 관계입니다. 여러 입력이 동일한 하나의 출력을 가질 수는 있지만, 하나의 입력이 여러 출력을 가질 수는 없습니다.

<img src="images/function-sets.gif" alt="function sets" />

반대로 아래 그림은 입력 `5`가 여러 출력과 연결되므로 수학적인 함수가 **아닙니다**:

<img src="images/relation-not-function.gif" alt="relation not function" />

함수는 `[(1, 2), (3, 6), (5, 10)]`처럼 (입력, 출력) 쌍으로 이루어진 집합이나 표로 생각할 수도 있습니다:

<table>
  <tr><th>입력</th><th>출력</th></tr>
  <tr><td>1</td><td>2</td></tr>
  <tr><td>2</td><td>4</td></tr>
  <tr><td>3</td><td>6</td></tr>
</table>

입력이 주어졌을 때 출력이 고정되어 있다면, 자바스크립트의 객체 리터럴로도 함수 관계를 표현할 수 있습니다:

```js
const toLowerCase = {
  A: "a",
  B: "b",
  C: "c",
  D: "d",
  E: "e",
  F: "f",
};
toLowerCase["C"]; // 'c'

const isPrime = {
  1: false,
  2: true,
  3: true,
  4: false,
  5: true,
  6: false,
};
isPrime[3]; // true
```

순수 함수는 바로 이러한 수학적 함수의 본질을 온전히 따르는 함수이며, 이것이 함수형 프로그래밍의 핵심입니다.

## 순수성의 장점

### 1. 캐시 가능성 (Memoization)

순수 함수는 동일한 입력에 대해 항상 동일한 결과를 반환하므로, 입력값을 키로 삼아 결과를 언제나 캐싱(memoization)할 수 있습니다:

```js
const squareNumber = memoize((x) => x * x);

squareNumber(4); // 16
squareNumber(4); // 16 (캐시된 값 반환)
squareNumber(5); // 25
squareNumber(5); // 25 (캐시된 값 반환)
```

간단한 `memoize` 구현 예시입니다:

```js
const memoize = (f) => {
  const cache = {};

  return (...args) => {
    const argStr = JSON.stringify(args);
    cache[argStr] = cache[argStr] || f(...args);
    return cache[argStr];
  };
};
```

### 2. 이식성과 자체 문서화 (Portability & Self-Documentation)

순수 함수는 완전히 자급자족합니다. 함수가 필요로 하는 모든 것은 인자를 통해 전달됩니다. 외부 숨겨진 의존성이 없기 때문에 코드를 읽는 것만으로 함수의 역할을 명확히 파악할 수 있습니다:

```js
// 비순수 (Impure)
const signUp = (attrs) => {
  const user = saveUser(attrs);
  welcomeUser(user);
};

// 순수 (Pure)
const signUp = (Db, Email, attrs) => () => {
  const user = saveUser(Db, attrs);
  welcomeUser(Email, user);
};
```

순수 함수는 의존성이 시그니처에 솔직하게 드러나며, 원하는 환경 어디서나 재사용하고 이식할 수 있습니다.

### 3. 뛰어난 테스트 용이성 (Testability)

순수 함수는 모킹(mocking)이나 복잡한 외부 환경 설정 없이, 단지 입력을 넣고 반환된 출력이 맞는지 검증하기만 하면 되므로 테스트 작성이 매우 간단합니다.

### 4. 참조 투명성과 방정식적 추론 (Referential Transparency & Equational Reasoning)

어떤 코드 조각을 프로그램의 실행 결과에 영향 없이 그 결과값으로 대체할 수 있을 때, 그 코드는 **참조 투명(referentially transparent)**하다고 합니다.

순수 함수는 언제나 참조 투명성을 가집니다. 덕분에 우리는 수학 방정식을 풀듯이 코드를 같은 가치의 표현식으로 치환하며 추론하는 **방정식적 추론(equational reasoning)**을 사용할 수 있습니다:

```js
const { Map } = require("immutable");

const jobe = Map({ name: "Jobe", hp: 20, team: "red" });
const michael = Map({ name: "Michael", hp: 20, team: "green" });
const decrementHP = (p) => p.set("hp", p.get("hp") - 1);
const isSameTeam = (p1, p2) => p1.get("team") === p2.get("team");
const punch = (a, t) => (isSameTeam(a, t) ? t : decrementHP(t));

punch(jobe, michael); // Map({name:'Michael', hp:19, team: 'green'})
```

위 코드에서 `isSameTeam`을 인라인화하면:
```js
const punch = (a, t) => (a.get("team") === t.get("team") ? t : decrementHP(t));
```

불변 데이터의 값을 대입하면:
```js
const punch = (a, t) => ("red" === "green" ? t : decrementHP(t));
```

조건문이 거짓이므로 단순화하면:
```js
const punch = (a, t) => decrementHP(t);
// 즉, t.set("hp", t.get("hp") - 1)
```

이러한 추론 방식은 복잡한 코드를 리팩토링하고 정확성을 검증할 때 엄청난 힘을 발휘합니다.

### 5. 병렬 실행 안전성 (Parallel Code)

순수 함수는 공유 메모리에 접근하지 않고 부수효과가 없으므로, 멀티스레드나 웹 워커 환경에서 경쟁 상태(race condition)에 대한 걱정 없이 안전하게 병렬 실행할 수 있습니다.

## 요약

우리는 순수 함수가 무엇이며 왜 순수 함수가 훌륭한지 살펴보았습니다. 이제 함수들을 최대한 순수하게 작성하고, 순수하지 않은 부분은 안전하게 격리할 것입니다.

이제 다음 도구인 **커링(Currying)**을 만나볼 준비가 되셨나요?

[04 장: 커링](ch04-kr.md)
