# 04 장: 커링

## 너 없인 못 살아 (Can't Live If Livin' Is without You)

제 아버지는 "직접 써보기 전까지는 그것 없이도 얼마든지 살 수 있다고 생각하는 물건들이 있다"고 말씀하신 적이 있습니다. 전자레인지나 스마트폰 같은 것들이 그렇죠. 우리 중 조금 나이가 있는 분들은 인터넷 없이 살던 시절을 기억할 것입니다. 저에게는 **커링(Currying)**이 바로 그런 존재입니다.

커링의 개념은 간단합니다. 함수가 기대하는 인자보다 적은 수의 인자로 함수를 호출하는 것입니다. 그러면 함수는 나머지 인자들을 받을 또 다른 함수를 반환합니다.

모든 인자를 한 번에 넘겨줄 수도 있고, 인자를 하나씩 차례대로 넘겨줄 수도 있습니다:

```js
const add = (x) => (y) => x + y;
const increment = add(1);
const addTen = add(10);

increment(2); // 3
addTen(2); // 12
```

우리는 인자를 하나 받아 함수를 반환하는 `add`를 만들었습니다. 반환된 함수는 클로저를 이용해 첫 번째 인자를 기억합니다. 하지만 매번 수동으로 이렇게 작성하는 것은 번거롭습니다. 그래서 우리는 함수를 훨씬 쉽게 커링하고 호출할 수 있도록 도와주는 특별한 도우미 함수인 `curry`를 사용할 것입니다.

[부록 A: 필수 함수 지원](./appendix_a.md)에 정의된 `curry`를 사용해 유용한 커리 함수들을 만들어 봅시다:

```js
const match = curry((what, s) => s.match(what));
const replace = curry((what, replacement, s) => s.replace(what, replacement));
const filter = curry((f, xs) => xs.filter(f));
const map = curry((f, xs) => xs.map(f));
```

여기서 사용한 패턴에 주목하세요. 의도적으로 처리할 데이터(문자열, 배열)를 맨 마지막 인자로 두었습니다. 이렇게 인자 순서를 정한 이유는 곧 명확해질 것입니다.

```js
match(/r/g, "hello world"); // [ 'r' ]

const hasLetterR = match(/r/g); // x => x.match(/r/g)
hasLetterR("hello world"); // [ 'r' ]
hasLetterR("just j and s and t etc"); // null

filter(hasLetterR, ["rock and roll", "smooth jazz"]); // ['rock and roll']

const removeStringsWithoutRs = filter(hasLetterR); // xs => xs.filter(x => x.match(/r/g))
removeStringsWithoutRs(["rock and roll", "smooth jazz", "drum circle"]); // ['rock and roll', 'drum circle']

const noVowels = replace(/[aeiou]/gi); // (r,x) => x.replace(/[aeiou]/ig, r)
const censored = noVowels("*"); // x => x.replace(/[aeiou]/ig, '*')
censored("Chocolate Rain"); // 'Ch*c*l*t* R**n'
```

함수에 몇 개의 인자를 "미리" 채워두면 함수가 그 인자를 기억하고 있다가, 나머지 인자가 들어왔을 때 실행되는 것을 볼 수 있습니다.

## 말장난 조금 더 / 특별한 소스

커링은 여러 방면으로 유용합니다. 우리는 기본 함수에 인자를 부분적으로 넘겨줌으로써 `hasLetterR`, `removeStringsWithoutRs`, `censored` 같은 새로운 함수들을 즉석에서 만들어낼 수 있었습니다.

또한 단일 원소에 작용하는 함수를 `map`으로 감싸 배열 전체에 작용하도록 확장할 수도 있습니다:

```js
const getChildren = (x) => x.childNodes;
const allTheChildren = map(getChildren);
```

함수가 기대하는 것보다 적은 인자를 넘겨주는 것을 **부분 적용(partial application)**이라고 부릅니다. 부분 적용을 활용하면 불필요한 보일러플레이트 코드를 획기적으로 줄일 수 있습니다.

**순수 함수**는 1개의 입력과 1개의 출력을 가집니다. 커링은 바로 이것을 완벽하게 구현해 줍니다. 인자를 하나 받을 때마다 나머지 인자를 기다리는 새로운 함수를 반환하므로, 수학적인 함수의 정의(1대 1 대응)를 온전히 유지할 수 있습니다.

## 요약

커링은 함수형 프로그래밍을 훨씬 덜 장황하고 즐겁게 만들어주는 핵심 도구입니다. 적은 수의 인자만 넘겨 즉석에서 재사용 가능한 새로운 함수를 조립할 수 있으며, 다중 인자 함수에서도 수학적인 엄밀함을 유지할 수 있습니다.

이제 또 다른 핵심 도구인 **합성(`compose`)**을 만나볼까요?

## 연습문제

#### 연습문제에 대하여

책을 읽다 보면 이와 같은 '연습문제' 섹션을 만날 수 있습니다. [Gitbook](https://mostly-adequate.gitbooks.io/mostly-adequate-guide)에서 읽고 계시다면 브라우저에서 직접 연습문제를 풀 수 있습니다(권장).

책의 모든 연습문제에서는 전역 스코프에서 사용 가능한 유용한 헬퍼 함수들이 항상 제공됩니다. 따라서 [부록 A](./appendix_a.md), [부록 B](./appendix_b.md), [부록 C](./appendix_c.md)에 정의된 모든 것을 바로 사용할 수 있습니다!

#### 로컬 환경에서 연습문제 실행하기 (선택사항)

- 저장소 클론: `git clone https://github.com/MostlyAdequate/mostly-adequate-guide-kr.git`
- exercises 디렉토리 이동: `cd mostly-adequate-guide-kr/exercises`
- 의존성 설치: `pnpm install`
- 정답 검증: `pnpm run ch04`

#### 연습해 봅시다!

{% exercise %}
함수를 부분 적용하여 모든 인자를 제거하도록 리팩토링하세요.

{% initial src="./exercises/ch04/exercise_a.js#L3;" %}

```js
const words = (str) => split(" ", str);
```

{% solution src="./exercises/ch04/solution_a.js" %}
{% validation src="./exercises/ch04/validation_a.js" %}
{% context src="./exercises/support.js" %}
{% endexercise %}

---

{% exercise %}
함수들을 부분 적용하여 모든 인자를 제거하도록 리팩토링하세요.

{% initial src="./exercises/ch04/exercise_b.js#L3;" %}

```js
const filterQs = (xs) => filter((x) => match(/q/i, x), xs);
```

{% solution src="./exercises/ch04/solution_b.js" %}
{% validation src="./exercises/ch04/validation_b.js" %}
{% context src="./exercises/support.js" %}
{% endexercise %}

---

다음 함수를 고려해 봅시다:

```js
const keepHighest = (x, y) => (x >= y ? x : y);
```

{% exercise %}
도우미 함수 `keepHighest`를 사용하고 인자를 직접 참조하지 않도록 `max`를 리팩토링하세요.

{% initial src="./exercises/ch04/exercise_c.js#L7;" %}

```js
const max = (xs) => reduce((acc, x) => (x >= acc ? x : acc), -Infinity, xs);
```

{% solution src="./exercises/ch04/solution_c.js" %}
{% validation src="./exercises/ch04/validation_c.js" %}
{% context src="./exercises/support.js" %}
{% endexercise %}

[05 장: 합성으로 코딩하기](ch05-kr.md)
