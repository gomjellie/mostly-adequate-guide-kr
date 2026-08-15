# 05 장: 합성으로 코딩하기

## 함수 기르기

여기 `compose`가 있습니다:

```js
const compose = (...fns) => (...args) => fns.reduceRight((res, fn) => [fn.call(null, ...res)], args)[0];
```

...겁먹지 마세요! 이것은 _compose_ 의 전투력 9000급 초사이어인 형태입니다. 개념을 이해하기 위해, 가변 인자 구현은 잠시 제쳐두고 두 개의 함수를 합성하는 단순한 형태를 먼저 살펴봅시다. 이 원리를 이해하고 나면, 함수가 몇 개이든 상관없이 동일하게 동작한다는 것을 쉽게 추상화할 수 있습니다(우리가 이를 증명할 수도 있습니다!).
친애하는 독자 여러분을 위해 훨씬 친근한 형태의 _compose_ 를 소개합니다:

```js
const compose2 = (f, g) => x => f(g(x));
```

`f`와 `g`는 함수이고, `x`는 두 함수를 거쳐 "파이프"처럼 흘러갈 값입니다.

합성은 마치 함수를 교배하여 기르는 것과 비슷합니다. 함수 사육사인 여러분은 결합하고 싶은 특징을 가진 두 함수를 선택하고, 둘을 한데 섞어 완전히 새로운 함수를 탄생시킵니다. 사용법은 다음과 같습니다:

```js
const toUpperCase = x => x.toUpperCase();
const exclaim = x => `${x}!`;
const shout = compose(exclaim, toUpperCase);

shout('send in the clowns'); // "SEND IN THE CLOWNS!"
```

두 함수의 합성은 새로운 함수를 반환합니다. 이는 매우 합리적입니다. 특정 타입(여기서는 함수)의 두 단위를 합성하면 정확히 동일한 타입의 새로운 단위가 나와야 합니다. 레고 블록 두 개를 끼웠는데 링컨 로그(통나무 완구)가 나올 수는 없으니까요. 여기에는 일정한 이론이 있으며, 때가 되면 우리가 발견하게 될 근본적인 법칙이 존재합니다.

우리의 `compose` 정의에서 `g`는 `f`보다 먼저 실행되어 오른쪽에서 왼쪽으로 흐르는 데이터 흐름을 만듭니다. 이는 함수 호출을 여러 겹 중첩하는 것보다 훨씬 읽기 좋습니다. `compose`가 없다면 위의 코드는 다음과 같이 작성되었을 것입니다:

```js
const shout = x => exclaim(toUpperCase(x));
```

안쪽에서 바깥쪽으로 읽는 대신 오른쪽에서 왼쪽으로 실행되며, 이는 한결 자연스러운 방향입니다. 순서가 중요한 예제를 살펴봅시다:

```js
const head = x => x[0];
const reverse = reduce((acc, x) => [x, ...acc], []);
const last = compose(head, reverse);

last(['jumpkick', 'roundhouse', 'uppercut']); // 'uppercut'
```

`reverse`는 리스트를 뒤집고, `head`는 첫 번째 아이템을 가져옵니다. 비효율적이긴 하지만 결과적으로 동작하는 `last` 함수가 완성됩니다. 이 합성에서 함수들의 실행 순서가 명확하게 보입니다. 왼쪽에서 오른쪽으로 실행되는 버전을 정의할 수도 있지만, 현재 형태가 수학에서의 정의를 훨씬 더 충실하게 따릅니다. 맞습니다, 합성은 수학 교과서에서 바로 가져온 개념입니다. 실제로 모든 합성에 적용되는 성질을 살펴볼 때가 되었습니다.

```js
// 결합법칙 (associativity)
compose(f, compose(g, h)) === compose(compose(f, g), h);
```

합성은 **결합법칙(associative)**을 만족하므로, 함수들을 둘씩 어떻게 묶든 상관이 없습니다. 따라서 문자열을 대문자로 바꾸고자 한다면 다음과 같이 작성할 수 있습니다:

```js
compose(toUpperCase, compose(head, reverse));
// 또는
compose(compose(toUpperCase, head), reverse);
```

`compose` 호출을 어떻게 묶든 상관없기 때문에 결과는 항상 동일합니다. 덕분에 여러 인자를 받는 variadic compose를 작성하여 다음과 같이 사용할 수 있습니다:

```js
// 이전에는 두 번의 compose를 작성해야 했지만, 결합법칙이 성립하므로
// 원하는 만큼 많은 함수를 compose에 전달하고 어떻게 묶을지는 알아서 결정하도록 할 수 있습니다.
const arg = ['jumpkick', 'roundhouse', 'uppercut'];
const lastUpper = compose(toUpperCase, head, reverse);
const loudLastUpper = compose(exclaim, toUpperCase, head, reverse);

lastUpper(arg); // 'UPPERCUT'
loudLastUpper(arg); // 'UPPERCUT!'
```

결합법칙을 적용하면 유연성을 얻을 수 있고, 결과가 동일할 것이라는 안도감을 가질 수 있습니다. 조금 더 복잡한 가변 인자 정의는 이 책의 지원 라이브러리에 포함되어 있으며, [lodash][lodash-website], [underscore][underscore-website], [ramda][ramda-website]와 같은 라이브러리에서 볼 수 있는 일반적인 정의입니다.

결합법칙의 아주 멋진 장점 중 하나는 어떤 함수 그룹이든 추출하여 그들만의 합성으로 묶어낼 수 있다는 점입니다. 이전 예제를 리팩토링해 보며 놀아봅시다:

```js
const loudLastUpper = compose(exclaim, toUpperCase, head, reverse);

// -- 또는 ---------------------------------------------------------------

const last = compose(head, reverse);
const loudLastUpper = compose(exclaim, toUpperCase, last);

// -- 또는 ---------------------------------------------------------------

const last = compose(head, reverse);
const angry = compose(exclaim, toUpperCase);
const loudLastUpper = compose(angry, last);

// 더 많은 변형이 가능합니다...
```

정답이나 오답은 없습니다. 우리는 원하는 방식대로 레고 블록을 조립하고 있을 뿐입니다. 보통은 `last`나 `angry`처럼 재사용 가능한 방식으로 그룹을 묶는 것이 가장 좋습니다. 마틴 파울러의 "[리팩터링][refactoring-book]"에 익숙하다면, 이 과정을 객체 상태에 대한 걱정이 전혀 없는 "[함수 추출하기][extract-function-refactor]"로 인식할 수 있을 것입니다.

## 포인트프리 (Pointfree)

포인트프리(Pointfree) 스타일이란 데이터에 대해 직접 언급하지 않는 것을 의미합니다. 다시 말해, 자신이 처리할 데이터를 결코 명시하지 않는 함수를 말합니다. 일급 함수, 커링, 합성이 함께 조화를 이루어 이 스타일을 만들어냅니다.

> 힌트: `replace`와 `toLowerCase`의 포인트프리 버전은 [부록 C - 포인트프리 유틸리티](./appendix_c.md)에 정의되어 있습니다. 주저하지 말고 살펴보세요!

```js
// 데이터를 직접 언급하므로(word) 포인트프리가 아닙니다
const snakeCase = word => word.toLowerCase().replace(/\s+/ig, '_');

// 포인트프리
const snakeCase = compose(replace(/\s+/ig, '_'), toLowerCase);
```

`replace`를 부분 적용한 것이 보이시나요? 우리가 하고 있는 일은 인자가 1개인 각 함수를 통해 데이터를 파이프로 흘려보내는 것입니다. 커링을 통해 각 함수가 데이터를 받아 처리하고 다음으로 넘겨줄 수 있도록 준비할 수 있습니다. 또 하나 주목할 점은 포인트프리 버전에서는 함수를 만들 때 데이터가 필요하지 않은 반면, 포인트풀(pointful) 버전에서는 무엇보다 먼저 `word`라는 데이터를 가지고 있어야 한다는 점입니다.

또 다른 예제를 살펴봅시다.

```js
// 데이터를 직접 언급하므로(name) 포인트프리가 아닙니다
const initials = name => name.split(' ').map(compose(toUpperCase, head)).join('. ');

// 포인트프리
// 참고: 09장에서 소개할 'join' 대신 부록의 'intercalate'를 사용합니다!
const initials = compose(intercalate('. '), map(compose(toUpperCase, head)), split(' '));

initials('hunter stockton thompson'); // 'H. S. T'
```

포인트프리 코드는 불필요한 이름 짓기를 없애주고 코드를 간결하고 범용적으로 유지하는 데 도움을 줍니다. 포인트프리는 입력에서 출력으로 이어지는 작은 함수들을 확보했음을 알려주므로 함수형 코드의 훌륭한 리트머스 시험지가 됩니다. 예를 들어 `while` 루프는 합성할 수 없습니다. 하지만 주의하세요. 포인트프리는 양날의 검이며 때로는 의도를 모호하게 만들 수도 있습니다. 모든 함수형 코드가 포인트프리일 필요는 없으며, 그래도 괜찮습니다. 가능한 곳에서는 포인트프리를 지향하고, 그렇지 않은 곳에서는 일반 함수를 사용하면 됩니다.

## 디버깅 (Debugging)

자주 하는 실수 중 하나는 두 개의 인자를 받는 `map`과 같은 함수를 먼저 부분 적용하지 않고 합성하는 것입니다.

```js
// 잘못된 예 - angry에 배열을 넘겨주게 되고, map은 알 수 없는 인자로 부분 적용됩니다.
const latin = compose(map, angry, reverse);

latin(['frog', 'eyes']); // error

// 올바른 예 - 각 함수는 인자 1개를 기대합니다.
const latin = compose(map(angry), reverse);

latin(['frog', 'eyes']); // ['EYES!', 'FROG!'])
```

합성을 디버깅하는 데 어려움을 겪고 있다면, 유용하지만 순수하지 않은 이 `trace` 함수를 사용하여 무슨 일이 일어나고 있는지 확인할 수 있습니다.

```js
const trace = curry((tag, x) => {
  console.log(tag, x);
  return x;
});

const dasherize = compose(
  intercalate('-'),
  toLower,
  split(' '),
  replace(/\s{2,}/ig, ' '),
);

dasherize('The world is a vampire');
// TypeError: Cannot read property 'apply' of undefined
```

무언가 잘못되었습니다. `trace`로 추적해 봅시다.

```js
const dasherize = compose(
  intercalate('-'),
  toLower,
  trace('after split'),
  split(' '),
  replace(/\s{2,}/ig, ' '),
);

dasherize('The world is a vampire');
// after split [ 'The', 'world', 'is', 'a', 'vampire' ]
```

아! `toLower`는 배열을 대상으로 동작하므로 `map`으로 감싸주어야 합니다.

```js
const dasherize = compose(
  intercalate('-'),
  map(toLower),
  split(' '),
  replace(/\s{2,}/ig, ' '),
);

dasherize('The world is a vampire'); // 'the-world-is-a-vampire'
```

`trace` 함수를 사용하면 디버깅 목적으로 특정 시점의 데이터를 확인할 수 있습니다. 하스켈(Haskell)이나 퓨어스크립트(PureScript) 같은 언어에도 개발 편의를 위한 유사한 함수들이 있습니다.

합성은 프로그램을 구성하는 도구가 될 것이며, 다행히도 모든 것이 제대로 작동하도록 보장하는 강력한 이론이 이를 뒷받침하고 있습니다. 그 이론을 살펴봅시다.

## 카테고리 이론 (Category Theory)

카테고리 이론(범주론)은 집합론, 타입 이론, 군론, 논리학 등 여러 분야의 개념을 형식화할 수 있는 추상적인 수학 분야입니다. 주로 대상(object), 사상(morphism), 변환(transformation)을 다루며, 이는 프로그래밍과 매우 밀접하게 닮아 있습니다. 다음은 각 개별 이론에서 바라본 동일한 개념들의 도표입니다.

<img src="images/cat_theory.png" alt="category theory" />

겁먹게 해드렸다면 죄송합니다. 이 모든 개념에 아주 친숙해질 필요는 없습니다. 제가 보여드리고자 한 것은 개념들의 중복이 얼마나 많은지, 그리고 왜 카테고리 이론이 이들을 하나로 통합하고자 하는지입니다.

카테고리 이론에는 '카테고리(범주)'라는 것이 있습니다. 카테고리는 다음 구성 요소를 갖는 모임으로 정의됩니다:

* 대상(object)들의 모임
* 사상(morphism)들의 모임
* 사상들의 합성에 대한 개념
* 항등(identity)이라 불리는 특별한 사상

카테고리 이론은 많은 것을 모델링할 수 있을 만큼 추상적이지만, 현재 우리가 관심을 두고 있는 타입과 함수에 이를 적용해 봅시다.

**대상들의 모임 (A collection of objects)**  
대상은 데이터 타입이 됩니다. 예를 들어 `String`, `Boolean`, `Number`, `Object` 등이 있습니다. 우리는 종종 데이터 타입을 가능한 모든 값들의 집합으로 봅니다. `Boolean`은 `[true, false]` 집합으로, `Number`는 가능한 모든 숫자 값의 집합으로 볼 수 있습니다. 타입을 집합으로 취급하는 것은 집합론을 활용해 다룰 수 있기 때문에 유용합니다.

**사상들의 모임 (A collection of morphisms)**  
사상은 우리가 매일 작성하는 일반적인 순수 함수들입니다.

**사상들의 합성에 대한 개념 (A notion of composition on the morphisms)**  
이것은 짐작하셨겠지만 우리의 새로운 장난감인 `compose`입니다. 우리는 `compose` 함수가 결합법칙을 만족한다고 이야기했는데, 이는 우연이 아니라 카테고리 이론의 모든 합성에서 반드시 성립해야 하는 성질이기 때문입니다.

다음은 합성을 보여주는 그림입니다:

<img src="images/cat_comp1.png" alt="category composition 1" />
<img src="images/cat_comp2.png" alt="category composition 2" />

코드에서의 구체적인 예는 다음과 같습니다:

```js
const g = x => x.length;
const f = x => x === 4;
const isFourLetterWord = compose(f, g);
```

**항등이라 불리는 특별한 사상 (A distinguished morphism called identity)**  
유용한 함수인 `id`를 소개합니다. 이 함수는 단순히 입력을 받아 그대로 돌려줍니다. 한번 살펴보세요:

```js
const id = x => x;
```

"도대체 저게 어디에 쓸모가 있다는 거지?"라고 생각하실 수도 있습니다. 우리는 다음 챕터들에서 이 함수를 광범위하게 사용할 것이지만, 지금은 우리의 값을 대신할 수 있는 함수, 즉 일상적인 데이터로 위장한 함수라고 생각하세요.

`id`는 `compose`와 잘 어우러져야 합니다. 모든 단항 함수(인자가 1개인 함수) `f`에 대해 항상 성립하는 성질이 있습니다:

```js
// 항등원 법칙 (identity)
compose(id, f) === compose(f, id) === f;
// true
```

숫자의 항등원 성질과 똑같습니다! 바로 이해되지 않더라도 시간을 두고 곱씹어 보세요. 우리는 곧 `id`가 사방에서 사용되는 것을 보게 될 것이지만, 지금은 주어진 값을 대신해 작동하는 함수라는 점을 이해하면 됩니다. 이는 포인트프리 코드를 작성할 때 매우 유용합니다.

자, 이제 타입과 함수로 이루어진 카테고리를 갖추었습니다. 이것이 처음 접하는 소개라면, 카테고리가 무엇이고 왜 유용한지 아직 조금 모호할 수 있습니다. 우리는 책 전반에 걸쳐 이 지식을 쌓아갈 것입니다. 지금 이 장, 이 문장에서는 적어도 합성에 대한 지혜, 즉 결합법칙과 항등원 성질을 제공한다는 점을 알 수 있습니다.

다른 카테고리에는 무엇이 있을까요? 노드를 대상(object), 엣지를 사상(morphism), 경로 연결을 합성으로 하는 유향 그래프 카테고리를 정의할 수 있습니다. 또한 숫자를 대상, `>=`를 사상으로 정의할 수도 있습니다(실제로 모든 부분 순서나 전순서는 카테고리가 될 수 있습니다). 수많은 카테고리가 있지만, 이 책의 목적을 위해서는 위에서 정의한 카테고리만 신경 쓰면 됩니다. 우리는 겉핥기를 충분히 마쳤으므로 다음으로 넘어가 봅시다.

## 요약

합성은 일련의 파이프처럼 함수들을 서로 연결합니다. 데이터는 당연히 그래야 하듯 애플리케이션을 통해 흘러갈 것입니다. 순수 함수는 결국 입력에서 출력으로 이어지는 것이므로, 이 사슬을 끊는 것은 출력을 무시하여 우리 소프트웨어를 쓸모없게 만드는 것과 같습니다.

우리는 합성을 다른 어떤 것보다 최우선의 설계 원칙으로 삼습니다. 합성이 우리의 앱을 단순하고 합리적으로 유지해주기 때문입니다. 카테고리 이론은 앱 아키텍처, 부수효과 모델링, 정확성 보장에서 큰 역할을 할 것입니다.

이제 이것들을 실제로 적용해 볼 좋은 시점입니다. 예제 애플리케이션을 만들어 봅시다.

## 연습문제

다음 각 연습문제에서는 다음과 같은 형태의 Car 객체를 다룹니다:

```js
{
  name: 'Aston Martin One-77',
  horsepower: 750,
  dollar_value: 1850000,
  in_stock: true,
}
```

{% exercise %}
`compose()`를 사용하여 아래 함수를 다시 작성하세요.

{% initial src="./exercises/ch05/exercise_a.js#L12;" %}
```js
const isLastInStock = (cars) => {
  const lastCar = last(cars);
  return prop('in_stock', lastCar);
};
```

{% solution src="./exercises/ch05/solution_a.js" %}
{% validation src="./exercises/ch05/validation_a.js" %}
{% context src="./exercises/support.js" %}
{% endexercise %}

---

다음 함수를 고려해 봅시다:

```js
const average = xs => reduce(add, 0, xs) / xs.length;
```

{% exercise %}
도우미 함수 `average`를 사용하여 `averageDollarValue`를 합성으로 리팩토링하세요.

{% initial src="./exercises/ch05/exercise_b.js#L7;" %}
```js
const averageDollarValue = (cars) => {
  const dollarValues = map(c => c.dollar_value, cars);
  return average(dollarValues);
};
```

{% solution src="./exercises/ch05/solution_b.js" %}
{% validation src="./exercises/ch05/validation_b.js" %}
{% context src="./exercises/support.js" %}
{% endexercise %}

---

{% exercise %}
`compose()`와 다른 함수들을 포인트프리 스타일로 사용하여 `fastestCar`를 리팩토링하세요. 힌트: `append` 함수가 유용하게 쓰일 수 있습니다.

{% initial src="./exercises/ch05/exercise_c.js#L4;" %}
```js
const fastestCar = (cars) => {
  const sorted = sortBy(car => car.horsepower);
  const fastest = last(sorted);
  return concat(fastest.name, ' is the fastest');
};
```

{% solution src="./exercises/ch05/solution_c.js" %}
{% validation src="./exercises/ch05/validation_c.js" %}
{% context src="./exercises/support.js" %}
{% endexercise %}

[06 장: 예제 애플리케이션](ch06-kr.md)

[lodash-website]: https://lodash.com/
[underscore-website]: https://underscorejs.org/
[ramda-website]: https://ramdajs.com/
[refactoring-book]: https://martinfowler.com/books/refactoring.html
[extract-function-refactor]: https://refactoring.com/catalog/extractFunction.html
