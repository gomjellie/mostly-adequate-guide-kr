# 10 장: 어플리카티브 펑터 (Applicative Functors)

## 어플리카티브 적용하기

**어플리카티브 펑터(applicative functor)**라는 이름은 함수형 프로그래밍의 기원을 고려할 때 유쾌할 정도로 직관적입니다. 함수형 프로그래머들은 수학 연구실에서는 지극히 자연스러워 보이지만 다른 맥락에서는 드라이브스루 앞의 우유부단한 다스 베이더처럼 모호한 `mappend`나 `liftA4` 같은 이름을 짓기로 악명 높습니다.

어쨌든 이 이름은 이 인터페이스가 우리에게 무엇을 제공하는지 그 비밀을 누설합니다: 바로 *펑터들을 서로에게 적용할 수 있는 능력*입니다.

여러분처럼 지극히 정상적이고 이성적인 사람이 왜 그런 것을 원할까요? 하나의 펑터를 다른 펑터에 적용한다는 것은 도대체 *무슨 뜻*일까요?

이 질문에 답하기 위해 함수형 여정에서 이미 마주쳤을 법한 상황부터 시작해 봅시다. 가령 (동일한 타입의) 두 펑터가 있고, 두 펑터 안의 값 모두를 인자로 삼아 함수를 호출하고 싶다고 가정해 봅시다. 두 `Container` 안의 값을 더하는 단순한 작업을 예로 들어보죠.

```js
// 값들이 병 안에 갇혀 있기 때문에 이렇게 할 수 없습니다.
add(Container.of(2), Container.of(3));
// NaN

// 우리의 믿음직한 map을 써봅시다
const containerOfAdd2 = map(add, Container.of(2));
// Container(add(2))
```

우리에게는 부분 적용된 함수를 품고 있는 `Container`가 있습니다. 구체적으로 `Container(add(2))`를 가지고 있으며, 호출을 완성하기 위해 그 `add(2)`를 `Container(3)` 안의 `3`에 적용하고 싶습니다. 다시 말해, 한 펑터를 다른 펑터에 적용하고 싶은 것입니다.

마침 우리는 이미 이 작업을 달성할 수 있는 도구를 가지고 있습니다. 다음과 같이 부분 적용된 `add(2)`를 `chain`한 다음 `map`할 수 있습니다:

```js
Container.of(2).chain(two => Container.of(3).map(add(two)));
```

문제는 우리가 이전 모나드가 작업을 마칠 때까지 아무것도 평가할 수 없는 모나드의 순차적 세상에 갇혀 있다는 점입니다. 우리에게는 강력하고 독립적인 두 개의 값이 있으며, 단순히 모나드의 순차적 요구를 만족시키기 위해 `Container(3)`의 생성을 지연시킬 필요는 없습니다.

실제로 이런 곤란한 상황에서 불필요한 함수와 변수 없이 한 펑터의 내용을 다른 펑터의 값에 간결하게 적용할 수 있다면 정말 멋질 것입니다.

## 병 속의 배

<img src="images/ship_in_a_bottle.jpg" alt="https://www.deviantart.com/hollycarden" />

`ap`는 한 펑터의 함수 내용을 다른 펑터의 값 내용에 적용할 수 있는 함수입니다.

```js
Container.of(add(2)).ap(Container.of(3));
// Container(5)

// 한 번에 합치면

Container.of(2).map(add).ap(Container.of(3));
// Container(5)
```

깔끔하게 해결되었습니다. `Container(3)`에게는 중첩된 모나드 함수의 감옥에서 풀려났으니 희소식입니다. 여기서 `add`는 첫 번째 `map` 동안 부분 적용되므로 `add`가 커링되어 있을 때만 동작한다는 점을 기억하세요.

`ap`를 다음과 같이 정의할 수 있습니다:

```js
Container.prototype.ap = function (otherContainer) {
  return otherContainer.map(this.$value);
};
```

`this.$value`가 함수이고 다른 펑터를 인자로 받을 것이므로 단순히 `map`하기만 하면 됩니다. 이렇게 해서 인터페이스 정의를 얻게 됩니다:

> *어플리카티브 펑터(Applicative Functor)*는 `ap` 메서드를 가진 포인티드 펑터입니다.

**포인티드(pointed)**에 대한 의존성에 주목하세요. 뒤이은 예제들에서 보게 되겠지만 포인티드 인터페이스는 여기서 핵심적입니다.

본격적으로 들어가기 전에 멋진 성질 하나를 살펴봅시다.

```js
F.of(x).map(f) === F.of(f).ap(F.of(x));
```

`f`를 매핑하는 것은 `f`의 펑터를 `ap`하는 것과 같습니다. 다시 말해, `x`를 컨테이너에 넣고 `map(f)`를 하거나, `f`와 `x` 모두를 컨테이너로 리프팅한 다음 둘을 `ap`할 수 있습니다. 이를 통해 왼쪽에서 오른쪽으로 읽히는 방식으로 코드를 작성할 수 있습니다:

```js
Maybe.of(add).ap(Maybe.of(2)).ap(Maybe.of(3));
// Maybe(5)

Task.of(add).ap(Task.of(2)).ap(Task.of(3));
// Task(5)
```

눈을 가늘게 뜨고 보면 일반적인 함수 호출의 윤곽이 어렴풋이 보일 것입니다. `of`를 사용하면 각 값이 컨테이너라는 마법의 세계로 이동하며, `ap`는 이 환상적인 세계 안에서 함수들을 적용합니다. 마치 유리병 속에 배를 조립하는 것과 같습니다.

위 예제에서 `Task`를 사용한 것을 보셨나요? 이는 어플리카티브 펑터가 제 몫을 톡톡히 해내는 대표적인 상황입니다.

## 조율의 동기

여행 사이트를 만들면서 관광 명소 목록과 지역 이벤트 목록을 둘 다 가져오고 싶다고 해봅시다. 이 둘은 각각 독립된 별도의 API 호출입니다.

```js
// Http.get :: String -> Task Error HTML

const renderPage = curry((destinations, events) => { /* render page */ });

Task.of(renderPage).ap(Http.get('/destinations')).ap(Http.get('/events'));
// Task("<div>some page with dest and events</div>")
```

두 `Http` 호출은 즉시 동시에 실행되며, 둘 다 완료되었을 때 `renderPage`가 호출됩니다. 다음 `Task`를 실행하기 전에 이전 `Task`가 반드시 완료되어야 하는 모나드 버전과 대조해 보세요. 이벤트를 가져오는 데 목적지가 필요하지 않으므로 순차적 평가로부터 자유롭습니다.

또 다른 예를 살펴봅시다.

```js
// $ :: String -> IO DOM
const $ = selector => new IO(() => document.querySelector(selector));

// getVal :: String -> IO String
const getVal = compose(map(prop('value')), $);

// signIn :: String -> String -> Bool -> User
const signIn = curry((username, password, rememberMe) => { /* 로그인 처리 */ });

IO.of(signIn).ap(getVal('#email')).ap(getVal('#password')).ap(IO.of(false));
// IO({ id: 3, email: 'gg@allin.com' })
```

`signIn`은 인자가 3개인 커리된 함수이므로 이에 맞게 `ap`를 호출합니다. 각 `ap`마다 `signIn`은 인자를 하나씩 더 받아 완성되면 실행됩니다. 필요한 만큼 인자를 계속 늘려갈 수 있습니다.

## 형, 리프팅 좀 해봤어?

이러한 어플리카티브 호출을 포인트프리 방식으로 작성하는 방법을 살펴봅시다. `map`이 `of/ap`와 동일하다는 것을 알고 있으므로, 원하는 횟수만큼 `ap`를 수행하는 범용 함수들을 작성할 수 있습니다:

```js
const liftA2 = curry((g, f1, f2) => f1.map(g).ap(f2));

const liftA3 = curry((g, f1, f2, f3) => f1.map(g).ap(f2).ap(f3));

// liftA4, etc
```

`liftA2`는 특이한 이름이지만 그 의미는 자명합니다: 이 조각들을 어플리카티브 펑터 세상으로 리프팅(들어 올리기)한다는 뜻입니다.

사용 예를 살펴봅시다:

```js
// checkEmail :: User -> Either String Email
// checkName :: User -> Either String String

const user = {
  name: 'John Doe',
  email: 'blurp_blurp',
};

//  createUser :: Email -> String -> IO User
const createUser = curry((email, name) => { /* 사용자 생성... */ });

Either.of(createUser).ap(checkEmail(user)).ap(checkName(user));
// Left('invalid email')

liftA2(createUser, checkEmail(user), checkName(user));
// Left('invalid email')
```

`createUser`가 두 개의 인자를 받으므로 해당하는 `liftA2`를 사용합니다. 두 문장은 동등하지만 `liftA2` 버전에는 `Either`에 대한 언급이 없습니다. 특정 타입에 얽매이지 않으므로 훨씬 더 범용적이고 유연합니다.

이전 예제들을 이렇게 다시 작성해 봅시다:

```js
liftA2(add, Maybe.of(2), Maybe.of(3));
// Maybe(5)

liftA2(renderPage, Http.get('/destinations'), Http.get('/events'));
// Task('<div>some page with dest and events</div>')

liftA3(signIn, getVal('#email'), getVal('#password'), IO.of(false));
// IO({ id: 3, email: 'gg@allin.com' })
```

## 연산자

사용자 정의 중위 연산자를 만들 수 있는 Haskell, Scala, PureScript, Swift 같은 언어에서는 다음과 같은 문법을 볼 수 있습니다:

```hs
-- Haskell / PureScript
add <$> Right 2 <*> Right 3
```

```js
// JavaScript
map(add, Right(2)).ap(Right(3));
```

`<$>`는 `map`(일명 `fmap`)이고 `<*>`는 `ap`라는 점을 알아두면 유용합니다.

## 공짜 깡통따개

<img src="images/canopener.jpg" alt="http://www.breannabeckmeyer.com/" />

이 모든 인터페이스들이 서로를 기반으로 구축되고 일련의 법칙을 따르기 때문에, 우리는 더 강력한 인터페이스를 기반으로 더 약한 인터페이스를 정의할 수 있습니다.

예를 들어 어플리카티브는 먼저 펑터이므로 어플리카티브 인스턴스가 있다면 우리 타입을 위한 펑터를 쉽게 정의할 수 있습니다.

앞서 `of/ap`가 `map`과 동등하다고 언급했습니다. 이 지식을 사용해 `map`을 공짜로 정의할 수 있습니다:

```js
// of/ap로부터 유도된 map
X.prototype.map = function map(f) {
  return this.constructor.of(f).ap(this);
};
```

모나드는 먹이사슬의 맨 위에 있으므로 `chain`이 있다면 펑터와 어플리카티브를 공짜로 얻게 됩니다:

```js
// chain으로부터 유도된 map
X.prototype.map = function map(f) {
  return this.chain(a => this.constructor.of(f(a)));
};

// chain/map으로부터 유도된 ap
X.prototype.ap = function ap(other) {
  return this.chain(f => other.map(f));
};
```

모나드를 정의할 수 있다면 어플리카티브와 펑터 인터페이스 모두를 정의할 수 있습니다.

그렇다면 그냥 모나드만 쓰면 되지 않느냐고 물으실 수 있습니다. 필요한 만큼의 힘만 사용하는 것이 좋은 습관입니다. 불필요한 기능을 배제함으로써 인지 부하를 최소화할 수 있습니다. 이 때문에 모나드보다 어플리카티브를 선호하는 것이 좋습니다.

## 법칙

어플리카티브 펑터가 만족하는 법칙들을 살펴봅시다. 먼저 어플리카티브는 "합성에 대해 닫혀(closed under composition)" 있습니다. 즉 `ap`는 컨테이너 타입을 절대 바꾸지 않습니다.

```js
const tOfM = compose(Task.of, Maybe.of);

liftA2(liftA2(concat), tOfM('Rainy Days and Mondays'), tOfM(' always get me down'));
// Task(Maybe(Rainy Days and Mondays always get me down))
```

### 항등원 (Identity)

```js
// 항등원
A.of(id).ap(v) === v;
```

펑터 안에서 `id`를 적용하는 것은 `v` 안의 값을 변경하지 않아야 합니다.

### 준동형사상 (Homomorphism)

```js
// 준동형사상
A.of(f).ap(A.of(x)) === A.of(f(x));
```

컨테이너 안에서 전체를 적용하든(좌변), 밖에서 적용한 후 컨테이너에 넣든(우변) 동일한 결과를 얻습니다.

### 교환 (Interchange)

```js
// 교환
v.ap(A.of(x)) === A.of(f => f(x)).ap(v);
```

함수를 `ap`의 좌변으로 리프팅하든 우변으로 리프팅하든 상관없다는 법칙입니다.

### 합성 (Composition)

```js
// 합성
A.of(compose).ap(u).ap(v).ap(w) === u.ap(v.ap(w));
```

컨테이너 내부에서 적용할 때도 표준적인 함수 합성이 성립함을 보장합니다.

## 요약

어플리카티브의 훌륭한 사용 사례는 여러 개의 펑터 인자가 있을 때입니다. 어플리카티브는 펑터 세상 안에서 함수를 인자들에 적용할 수 있는 능력을 줍니다. 비록 모나드로도 이를 수행할 수 있지만, 모나드 특유의 순차적 기능이 필요하지 않을 때는 어플리카티브 펑터를 선호해야 합니다.

다음 장에서는 여러 펑터를 더 잘 다루고 원칙에 따라 분해하는 방법을 배울 것입니다.

## 연습문제

{% exercise %}
`Maybe`와 `ap`를 사용하여 null일 수 있는 두 숫자를 더하는 함수를 작성하세요.

{% initial src="./exercises/ch10/exercise_a.js#L3;" %}
```js
// safeAdd :: Maybe Number -> Maybe Number -> Maybe Number
const safeAdd = undefined;
```

{% solution src="./exercises/ch10/solution_a.js" %}
{% validation src="./exercises/ch10/validation_a.js" %}
{% context src="./exercises/support.js" %}
{% endexercise %}

---

{% exercise %}
exercise_a의 `safeAdd`를 `ap` 대신 `liftA2`를 사용하도록 다시 작성하세요.

{% initial src="./exercises/ch10/exercise_b.js#L3;" %}
```js
// safeAdd :: Maybe Number -> Maybe Number -> Maybe Number
const safeAdd = undefined;
```

{% solution src="./exercises/ch10/solution_b.js" %}
{% validation src="./exercises/ch10/validation_b.js" %}
{% context src="./exercises/support.js" %}
{% endexercise %}

---

다음 연습문제에서는 아래 도우미들을 고려합니다:

```js
const localStorage = {
  player1: { id: 1, name: 'Albert' },
  player2: { id: 2, name: 'Theresa' },
};

// getFromCache :: String -> IO User
const getFromCache = x => new IO(() => localStorage[x]);

// game :: User -> User -> String
const game = curry((p1, p2) => `${p1.name} vs ${p2.name}`);
```

{% exercise %}
캐시에서 player1과 player2를 모두 가져와 게임을 시작하는 IO를 작성하세요.

{% initial src="./exercises/ch10/exercise_c.js#L16;" %}
```js
// startGame :: IO String
const startGame = undefined;
```

{% solution src="./exercises/ch10/solution_c.js" %}
{% validation src="./exercises/ch10/validation_c.js" %}
{% context src="./exercises/support.js" %}
{% endexercise %}

[11 장: 다시 변환하기, 자연스럽게](ch11-kr.md)
