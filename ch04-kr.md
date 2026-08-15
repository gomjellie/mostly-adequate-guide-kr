# 04 장: 커링

## Can't Live If Livin' Is without You

제 아버지는 사람이 그것들을 얻기 전까지 없이 살 수 있는 것들이 있다고 말씀하신 적이 있어요. 전자레인지나 스마트폰 등등이 그렇지요. 우리 중의 오래된 사람들은 인터넷 없는 삶을 사는 것을 기억할 것이에요. 저에게는 커링이 이 목록에 있습니다.

커링의 개념은 간단해요. 함수가 예상하는 인자보다 적은 인자로 함수를 부르는 것이지요. 그리고 이 때 함수는 나머지 인자를 함수를 받는 함수를 반환해요.

당신은 모든 인자를 한번에 넘겨주거나 단순히 인자를 하나씩 넘겨주는 것 중에 선택할 수 있어요.

```js
const add = (x) => (y) => x + y;
const increment = add(1);
const addTen = add(10);

increment(2); // 3
addTen(2); // 12
```

우리는 인자를 하나 받고 함수를 반환하는 `add`를 만들었어요. 이것을 호출해서 반환되는 함수는 클로져를 이용해 첫번째 인자를 기억하지요. 하지만 두 인자를 한번에 부르는 것은 좀 복잡한 일입니다. 그래서 우리는 함수를 조금 더 쉽게 만들고 호출할 수 있게 해주는 특별한 도우미 함수인 `curry`를 사용해 볼 것입니다.

재미를 위해 몇가지 커리된 함수를 만들어볼까요. 이제부터 우리는 [Appendix A - Essential Function Support](./appendix_a.md)에 정의된 `curry`를 소환할것입니다.

```js
const match = curry((what, s) => s.match(what));
const replace = curry((what, replacement, s) => s.replace(what, replacement));
const filter = curry((f, xs) => xs.filter(f));
const map = curry((f, xs) => xs.map(f));
```

여기서 사용한 패턴은 간단하지만 주목할 점이 있습니다. 저는 의도적으로 데이터(String, Array)를 마지막 인자에 두었어요. 왜 이렇게 했는지는 차차 명확해질겁니다.

(`/r/g` 문법은 **모든 'r'**을 가르키는 정규 표현식입니다. 궁금하다면 [정규 표현식](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions)에 대한 글을 읽어보세요.)

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

여기서 하나나 두개의 인자를 함수에 "미리" 설정하고 함수는 이 인자들을 기억하는 것을 볼 수 있어요.

저는 당신이 Mostly Adequate repository (`git clone https://github.com/MostlyAdequate/mostly-adequate-guide.git`)를 클론하고 위의 코드를 복사한 후에 REPL에서 돌려보는 것을 추천해요. 커리를 해주는 함수는 부록에 정의된 다른 것들과 마찬가지로 `support/index.js` 모듈에 있습니다.

아니면 `npm`에 배포된 버전을 한번 보세요.

```
npm install @mostly-adequate/support
```

## 말장난 조금 더 / 특별한 소스

커링은 여러 방면으로 유용합니다. 우리는 `hasLetterR`과 `removeStringsWithoutRs`, `censored`의 예에서 기본 함수에 몇가지 인자를 줌으로써 새로운 함수를 만드는 것을 봤어요.

또한 하나의 인자에만 작용하는 함수가 배열에 작용할 수 있도록 `map`으로 감싸는 것도 보았지요.

```js
const getChildren = (x) => x.childNodes;
const allTheChildren = map(getChildren);
```

보통 함수가 예상하는 것보다 덜 인자를 넘겨주는 것을 **부분 적용(partial application)**이라고 부릅니다. 함수에 부분 적용을 하면 보일러 플레이트 코드를 많이 줄여줍니다. losash의 커리되지 않은 `map`을 위의 `allTheChildren`에 사용하는 것을 생각해봅시다. 인자의 순서가 다르다는 것을 눈여겨보세요.

```js
const allTheChildren = (elements) => map(elements, getChildren);
```

우리는 그냥 인라인에서 `map(getChildren)`으로 호출할 수 있기 때문에 보통 배열에 적용되는 함수를 따로 정의하지는 않습니다. `sort`, `filter`와 다른 고차 함수들도 마찬가지입니다(**고차 함수**는 함수를 받거나 반환하는 함수입니다.).

**순수 함수**에 대해서 말할 때 그들이 1개의 입력과 1개의 출력을 가지고 있다고 말했지요. 바로 커링이 이것을 합니다. 하나의 인자를 받을 때마다 나머지 인자를 기대하는 함수를 반환합니다. 이것이 오래된 스포츠는 1대 1의 입력입니다.

출력이 다른 함수이지만 이것은 순수합니다. 우리는 한번에 한개 이상의 인자를 줄 수도 있지만 이것은 단순히 편의를 위해 여분의 `()`를 제거하는 것으로 볼 수 있어요.

## 요약

커링은 편리하고 저는 매일 커리된 함수와 함께하는 것을 즐기고 있어요. 커링은 함수형 프로그래밍을 좀 덜 장황하고 지루하게 만들어주는 도구입니다.

우리는 인자를 조금만 넘겨주면서 즉석에서 유용하고 새로운 함수를 만들 수 있어요. 또 함수가 여러 인자를 요구함에도 수학적인 함수 정의를 얻을 수 있어요.

이제 또 다른 도구인 합성(`compose`)을 만나볼까요?

## 연습문제

#### 연습문제에 대하여

책을 읽다 보면 이와 같은 '연습문제' 섹션을 만날 수 있습니다. [Gitbook](https://mostly-adequate.gitbooks.io/mostly-adequate-guide)에서 읽고 계시다면 브라우저에서 직접 연습문제를 풀 수 있습니다(권장).

책의 모든 연습문제에서는 전역 스코프에서 사용 가능한 유용한 헬퍼 함수들이 항상 제공됩니다. 따라서 [부록 A](./appendix_a.md), [부록 B](./appendix_b.md), [부록 C](./appendix_c.md)에 정의된 모든 것을 바로 사용할 수 있습니다! 뿐만 아니라 일부 연습문제는 해당 문제에 특화된 함수를 별도로 정의하기도 하므로, 그 함수들 역시 자유롭게 사용할 수 있습니다.

> 힌트: 내장 에디터에서 `Ctrl + Enter`를 누르면 답안을 제출할 수 있습니다!

#### 로컬 환경에서 연습문제 실행하기 (선택사항)

자신의 에디터를 사용해 파일에서 직접 문제를 풀고 싶다면:

- 저장소를 클론합니다 (`git clone https://github.com/MostlyAdequate/mostly-adequate-guide-kr.git`)
- exercises 디렉토리로 이동합니다 (`cd mostly-adequate-guide-kr/exercises`)
- [pnpm](https://pnpm.io/) 또는 npm을 사용해 필요한 의존성을 설치합니다 (`pnpm install`)
- 해당 챕터 폴더의 `exercise_*.js` 파일들을 수정하여 답안을 완성합니다
- 테스트를 실행하여 정답을 확인합니다 (예: `pnpm run ch04`)

작성한 답안을 대상으로 단위 테스트가 실행되며 오답일 경우 힌트를 제공합니다. 참고로 연습문제의 해답은 `solution_*.js` 파일에서 확인할 수 있습니다.

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

