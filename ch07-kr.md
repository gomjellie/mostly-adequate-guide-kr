# 07 장: 힌들리-밀너와 나

## 당신은 무슨 타입인가요?

함수형 세상에 처음 오셨다면 머지않아 타입 시그니처의 매력에 깊이 빠지게 될 것입니다. 타입은 서로 다른 배경을 가진 개발자들이 명료하고 효과적으로 소통할 수 있게 해주는 메타 언어입니다. 대부분의 함수형 언어에서는 이 장에서 다루는 **힌들리-밀너(Hindley-Milner, HM)** 체계를 이용해 타입을 표현합니다.

순수 함수를 다룰 때, 말로는 길게 설명해야 하는 것들을 타입 시그니처 한 줄로 우아하게 표현할 수 있습니다. 타입 시그니처는 함수의 내밀한 작동 원리를 귓가에 속삭여 주는 것과 같습니다. 간결한 한 줄만으로 함수의 동작과 의도를 명확히 파악할 수 있으며, 뒤에서 살펴볼 "공짜 정리(free theorems)"를 도출할 수도 있습니다. 타입 시그니처는 컴파일 타임 검사뿐만 아니라 최고의 문서화 도구입니다.

자바스크립트는 동적 언어이지만 타입을 전혀 고려하지 않는다는 뜻은 아닙니다. 우리는 문자열, 숫자, 불리언을 일상적으로 다룹니다. 단지 언어 차원에서 강제하지 않을 뿐이며, 따라서 주석을 통해 타입 정보를 명시하는 것이 큰 도움이 됩니다.

## 비밀 이야기

힌들리-밀너 타입 시그니처는 다음과 같은 형태로 표기합니다:

```js
// capitalize :: String -> String
const capitalize = (s) => toUpperCase(head(s)) + toLowerCase(tail(s));

capitalize("smurf"); // 'Smurf'
```

위의 `capitalize`는 `String`을 받아서 `String`을 반환합니다.

HM에서 함수는 `a -> b`로 표기합니다. 여기서 `a`와 `b`는 어떤 타입을 나타내는 변수입니다. 따라서 `capitalize`의 시그니처는 "`String`을 입력받아 `String`을 반환하는 함수"라고 읽을 수 있습니다.

다른 예제들도 살펴봅시다:

```js
// strLength :: String -> Number
const strLength = (s) => s.length;

// join :: String -> [String] -> String
const join = curry((what, xs) => xs.join(what));

// match :: Regex -> String -> [String]
const match = curry((reg, s) => s.match(reg));

// replace :: Regex -> String -> String -> String
const replace = curry((reg, sub, s) => s.replace(reg, sub));
```

다중 인자 함수는 커링 덕분에 다음과 같이 괄호로 묶어서 생각할 수 있습니다:

```js
// match :: Regex -> (String -> [String])
const match = curry((reg, s) => s.match(reg));

// onHoliday :: String -> [String]
const onHoliday = match(/holiday/gi);
```

`match`는 `Regex`를 받아 "문자열을 받아 문자열 배열을 반환하는 함수"를 반환합니다.

```js
// id :: a -> a
const id = (x) => x;

// map :: (a -> b) -> [a] -> [b]
const map = curry((f, xs) => xs.map(f));
```

`id` 함수는 임의의 타입 `a`를 받아 동일한 타입 `a`의 값을 반환합니다. `a -> a`는 입력과 출력의 타입이 반드시 동일해야 함을 의미합니다.

`map`은 `a`를 받아 `b`를 반환하는 함수 `(a -> b)`와 `a`의 배열 `[a]`를 받아 `b`의 배열 `[b]`를 반환합니다. 타입 시그니처만 보아도 함수가 무엇을 하는지 명확히 드러납니다.

```js
// head :: [a] -> a
const head = (xs) => xs[0];

// filter :: (a -> Bool) -> [a] -> [a]
const filter = curry((f, xs) => xs.filter(f));

// reduce :: ((b, a) -> b) -> b -> [a] -> b
const reduce = curry((f, x, xs) => xs.reduce(f, x));
```

## 가능성을 좁히기 (Parametricity)

타입 변수가 도입되면 **매개변수성(Parametricity)**이라는 강력한 속성이 나타납니다. 이 속성은 함수가 **임의의 모든 타입에 걸쳐 완전히 일관된 방식으로 동작해야 함**을 의미합니다.

```js
// head :: [a] -> a
```

`head`는 구체적인 타입 `a`에 대해 아무것도 알지 못하므로 `a`의 내부 메서드를 임의로 호출할 수 없습니다. 따라서 배열에서 원소를 꺼내어 그대로 반환하는 것 외에는 다른 동작을 할 수 없습니다. 이처럼 다형적 타입(polymorphic type)은 함수의 가능한 구현 범위를 강력하게 제한합니다.

## 공짜로 정리 얻기 (Free Theorems)

이러한 매개변수성 덕분에 코드 구현을 보지 않고도 타입 시그니처만으로 성립하는 공식인 **공짜 정리(Free Theorems)**를 얻을 수 있습니다:

```js
// head :: [a] -> a
compose(f, head) === compose(head, map(f));

// filter :: (a -> Bool) -> [a] -> [a]
compose(map(f), filter(compose(p, f))) === compose(filter(p), map(f));
```

첫 번째 정리는 모든 원소에 `map(f)`를 수행한 후 첫 번째 원소를 꺼내는 것보다, 첫 번째 원소를 먼저 꺼내어 `f`를 적용하는 것이 동일한 결과를 내며 훨씬 빠르다는 것을 보장합니다.

## 타입 제약 (Type Constraints)

타입을 특정 인터페이스를 만족하는 타입으로 제한할 수도 있습니다:

```js
// sort :: Ord a => [a] -> [a]
// assertEqual :: (Eq a, Show a) => a -> a -> Assertion
```

`=>` 왼쪽의 `Ord a`는 `a`가 반드시 대소 비교가 가능한 `Ord` 인터페이스를 구현해야 함을 나타냅니다. 이를 **타입 제약(type constraints)**이라고 부릅니다.

## 요약

힌들리-밀너 타입 시그니처는 함수형 세상의 공용어입니다. 읽고 쓰기 쉬우며 시그니처만으로도 프로그램의 동작과 의도를 깊이 이해할 수 있습니다.

[08 장: 터퍼웨어 (Tupperware)](ch08-kr.md)
