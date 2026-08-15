# 13 장: 모노이드가 모든 것을 하나로 묶다 (Monoids bring it all together)

## 거친 조합

이 장에서는 **세미그룹(semigroup, 반군)**을 통해 **모노이드(monoid, 단군)**를 살펴볼 것입니다. 모노이드는 수학적 추상화의 정수입니다. 여러 학문에 걸쳐 있는 아이디어를 포착하여 비유적으로나 문자 그대로 모든 것을 하나로 모읍니다. 계산되는 모든 것을 연결하는 거대한 힘이자 우리 코드베이스의 산소이며, 코드가 실행되는 토대이자 코드화된 양자 얽힘과 같습니다.

*모노이드*는 결합(combination)에 관한 것입니다. 하지만 결합이란 무엇일까요? 누적에서 연결, 곱셈, 선택, 합성, 순서 지정, 심지어 평가에 이르기까지 너무나 많은 것을 의미할 수 있습니다! 여기에서 많은 예를 보겠지만 우리는 모노이드라는 산의 기슭만 살짝 밟아볼 뿐입니다. 인스턴스는 풍부하고 적용 분야는 방대합니다. 이 장의 목표는 여러분이 자신만의 모노이드를 만들 수 있도록 훌륭한 직관을 제공하는 것입니다.

## 덧셈 추상화하기

덧셈에는 몇 가지 흥미로운 성질이 있습니다. 추상화의 안경을 쓰고 살펴봅시다.

우선 덧셈은 이항 연산(binary operation)입니다. 즉, 동일한 집합 안에서 두 개의 값을 받아 하나의 값을 반환하는 연산입니다.

```js
// 이항 연산
1 + 1 = 2
```

보이시나요? 정의역에 두 개의 값, 공역에 하나의 값이 있으며 모두 동일한 집합(숫자)에 속합니다. 숫자 집합은 "덧셈에 대해 닫혀 있다(closed under addition)"고 말할 수 있으며, 어떤 숫자를 섞든 타입이 결코 변하지 않는다는 뜻입니다. 이는 결과가 항상 또 다른 숫자이므로 연산을 계속 연결할 수 있음을 의미합니다:

```js
// 얼마든지 많은 숫자에 걸쳐 실행할 수 있습니다
1 + 7 + 5 + 4 + ...
```

게다가 결합법칙(associativity)이 성립하므로 연산을 원하는 대로 묶을 수 있습니다. 결합법칙을 만족하는 이항 연산은 작업을 쪼개어 분산할 수 있기 때문에 병렬 컴퓨팅을 위한 완벽한 레시피가 됩니다.

```js
// 결합법칙
(1 + 2) + 3 = 6
1 + (2 + 3) = 6
```

교환법칙(순서를 바꾸는 것)과 혼동하지 마세요. 덧셈에서는 교환법칙도 성립하지만 우리의 추상화에는 너무 구체적인 성질이라 지금은 크게 관심이 없습니다.

수학 선조들은 덧셈을 추상화할 때 **군(group)**이라는 개념에 도달했습니다. *군*에는 음수 개념을 포함하여 모든 기능이 갖추어져 있습니다. 여기서 우리는 결합법칙을 만족하는 이항 연산자에만 관심이 있으므로 덜 구체적인 인터페이스인 **세미그룹(Semigroup)**을 선택할 것입니다. *세미그룹*은 결합법칙을 만족하는 이항 연산자 역할을 하는 `concat` 메서드를 가진 타입입니다.

덧셈을 위해 이를 구현하고 `Sum`이라고 불러봅시다:

```js
const Sum = x => ({
  x,
  concat: other => Sum(x + other.x),
});
```

다른 `Sum`과 `concat`하며 항상 `Sum`을 반환한다는 점에 주목하세요.

```js
Sum(1).concat(Sum(3)); // Sum(4)
Sum(4).concat(Sum(37)); // Sum(41)
```

이 인터페이스는 군론에서 유래했으므로 수세기에 걸친 문헌이 이를 뒷받침합니다.

`Sum`은 *포인티드*도 아니고 *펑터*도 아닙니다. 숫자만 담을 수 있으므로 기본 값을 다른 타입으로 변환할 수 없어 `map`이 의미가 없기 때문입니다.

이것이 왜 유용할까요? 다른 인터페이스와 마찬가지로 인스턴스를 교체하여 다른 결과를 얻을 수 있습니다:

```js
const Product = x => ({ x, concat: other => Product(x * other.x) });

const Min = x => ({ x, concat: other => Min(x < other.x ? x : other.x) });

const Max = x => ({ x, concat: other => Max(x > other.x ? x : other.x) });
```

숫자에만 국한되지 않습니다. 다른 타입들도 살펴보죠:

```js
const Any = x => ({ x, concat: other => Any(x || other.x) });
const All = x => ({ x, concat: other => All(x && other.x) });

Any(false).concat(Any(true)); // Any(true)
Any(false).concat(Any(false)); // Any(false)

All(false).concat(All(true)); // All(false)
All(true).concat(All(true)); // All(true)

[1, 2].concat([3, 4]); // [1, 2, 3, 4]

"miracle grow".concat("n"); // "miracle grown"

Map({ day: 'night' }).concat(Map({ white: 'nikes' })); // Map({ day: 'night', white: 'nikes' })
```

자료구조를 병합하고, 논리를 결합하고, 문자열을 만들고... 거의 모든 작업을 이 결합 기반 인터페이스로 다룰 수 있습니다.

## 내가 가장 좋아하는 모든 펑터는 세미그룹이다

지금까지 본 펑터 인터페이스 구현체들은 모두 세미그룹 인터페이스도 구현합니다. `Identity`를 살펴봅시다:

```js
Identity.prototype.concat = function (other) {
  return new Identity(this.__value.concat(other.__value));
};

Identity.of(Sum(4)).concat(Identity.of(Sum(1))); // Identity(Sum(5))
Identity.of(4).concat(Identity.of(1)); // TypeError: this.__value.concat is not a function
```

`__value`가 세미그룹일 때만 세미그룹이 됩니다.

다른 타입들도 유사한 동작을 보입니다:

```js
// 에러 처리와 함께 결합
Right(Sum(2)).concat(Right(Sum(3))); // Right(Sum(5))
Right(Sum(2)).concat(Left('some error')); // Left('some error')

// 비동기 결합
Task.of([1, 2]).concat(Task.of([3, 4])); // Task([1, 2, 3, 4])
```

이 세미그룹들을 연속적인 결합으로 쌓아 올릴 때 특히 유용해집니다:

```js
// formValues :: Selector -> IO (Map String String)
// validate :: Map String String -> Either Error (Map String String)

formValues('#signup').map(validate).concat(formValues('#terms').map(validate)); // IO(Right(Map({username: 'andre3000', accepted: true})))
formValues('#signup').map(validate).concat(formValues('#terms').map(validate)); // IO(Left('one must accept our totalitarian agreement'))

serverA.get('/friends').concat(serverB.get('/friends')); // Task([friend1, friend2])

// loadSetting :: String -> Task Error (Maybe (Map String Boolean))
loadSetting('email').concat(loadSetting('general')); // Task(Maybe(Map({backgroundColor: true, autoSave: false})))
```

세미그룹만으로 구성된 모든 것은 그 자체로 세미그룹이 됩니다.

```js
const Analytics = (clicks, path, idleTime) => ({
  clicks,
  path,
  idleTime,
  concat: other =>
    Analytics(clicks.concat(other.clicks), path.concat(other.path), idleTime.concat(other.idleTime)),
});

Analytics(Sum(2), ['/home', '/about'], Right(Max(2000))).concat(Analytics(Sum(1), ['/contact'], Right(Max(1000))));
// Analytics(Sum(3), ['/home', '/about', '/contact'], Right(Max(2000)))
```

## 공짜 모노이드

우리는 덧셈을 추상화하고 있었지만 0이라는 개념이 빠져 있었습니다.

0은 **항등원(identity)** 역할을 합니다. 어떤 요소에 `0`을 더해도 자기 자신이 그대로 반환됩니다. 추상화 관점에서 `0`은 일종의 중립적이거나 *빈(empty)* 요소로 생각할 수 있습니다.

```js
// 항등원
1 + 0 = 1
0 + 1 = 1
```

이 개념을 `empty`라고 부르고 이를 이용해 새로운 인터페이스를 만들어 봅시다: 바로 **모노이드(Monoid)**입니다. 모노이드의 레시피는 임의의 *세미그룹*에 특별한 *항등원* 요소를 추가하는 것입니다. 타입 자체에 `empty` 함수를 두어 구현합니다:

```js
Array.empty = () => [];
String.empty = () => "";
Sum.empty = () => Sum(0);
Product.empty = () => Product(1);
Min.empty = () => Min(Infinity);
Max.empty = () => Max(-Infinity);
All.empty = () => All(true);
Any.empty = () => Any(false);
```

코드에서 이는 합리적인 기본값에 해당합니다:

```js
const settings = (prefix = String.empty(), overrides = Array.empty(), total = Sum.empty()) => /* ... */;
```

또한 누산기(accumulator)를 위한 완벽한 초깃값이 됩니다.

## 전부 접어 내리기

`concat`과 `empty`는 `reduce`의 첫 두 자리에 완벽하게 들어맞습니다.

커리된 `reduce` 함수를 사용하여 `empty` 값이 필수로 지정되는 안전한 버전을 만들 수 있으며, 이를 `fold`라고 부릅니다:

```js
// fold :: Monoid m => m -> [m] -> m
const fold = reduce(concat);
```

초깃값 `m`은 우리의 `empty` 값(중립적인 시작점)이며, `m`들의 배열을 가져와 하나의 아름다운 다이아몬드 같은 값으로 압축합니다.

```js
fold(Sum.empty(), [Sum(1), Sum(2)]); // Sum(3)
fold(Sum.empty(), []); // Sum(0)

fold(Any.empty(), [Any(false), Any(true)]); // Any(true)
fold(Any.empty(), []); // Any(false)

fold(Either.of(Max.empty()), [Right(Max(3)), Right(Max(21)), Right(Max(11))]); // Right(Max(21))
fold(Either.of(Max.empty()), [Right(Max(3)), Left('error retrieving value'), Right(Max(11))]); // Left('error retrieving value')

fold(IO.of([]), ['.link', 'a'].map($)); // IO([<a>, <button class="link"/>, <a>])
```

## 완전히 모노이드는 아닌 것

초깃값을 제공할 수 없어 *모노이드*가 될 수 없는 *세미그룹*도 있습니다. `First`를 보시죠:

```js
const First = x => ({ x, concat: other => First(x) });

Map({ id: First(123), isPaid: Any(true), points: Sum(13) }).concat(Map({ id: First(2242), isPaid: Any(false), points: Sum(1) }));
// Map({ id: First(123), isPaid: Any(true), points: Sum(14) })
```

계정들을 병합하면서 `First` id를 유지합니다. 여기에 대해 `empty` 값을 정의할 방법은 없지만 그렇다고 유용하지 않은 것은 아닙니다.

## 대통합 이론

### 군론인가 카테고리 이론인가?

이항 연산의 개념은 추상대수학 어디에나 있습니다. 실제로 카테고리의 주요 연산이기도 합니다. 카테고리 이론에서는 *항등원* 없이는 연산을 모델링할 수 없습니다. 이것이 우리가 군론의 세미그룹에서 시작하여 *empty*를 갖춘 카테고리 이론의 모노이드로 넘어가는 이유입니다.

모노이드는 `concat`이 사상이고, `empty`가 항등원이며, 합성이 보장되는 단일 대상(single object) 카테고리를 형성합니다.

### 모노이드로서의 합성

정의역과 공역이 동일한 집합에 속하는 `a -> a` 타입의 함수를 **자기사상(endomorphism)**이라고 부릅니다. 이 개념을 담은 `Endo`라는 *모노이드*를 만들 수 있습니다:

```js
const Endo = run => ({
  run,
  concat: other =>
    Endo(compose(run, other.run)),
});

Endo.empty = () => Endo(identity);

// 사용 예

// thingDownFlipAndReverse :: Endo [String] -> [String]
const thingDownFlipAndReverse = fold(Endo(() => []), [Endo(reverse), Endo(sort), Endo(append('thing down'))]);

thingDownFlipAndReverse.run(['let me work it', 'is it worth it?']);
// ['thing down', 'let me work it', 'is it worth it?']
```

모두 동일한 타입이므로 `compose`를 통해 `concat`할 수 있고 타입은 항상 일치합니다.

### 모노이드로서의 모나드

`join`은 두 개의 (중첩된) 모나드를 가져와 결합법칙을 만족하며 하나로 압축하는 연산입니다. 이는 또한 자연 변환입니다. 대상을 펑터로, 사상을 자연 변환으로 하는 카테고리를 만들 수 있으며, 이를 엔도펑터(Endofunctor)로 특화하면 `join`은 엔도펑터 카테고리에서의 모노이드, 즉 **모나드(Monad)**를 제공합니다.

### 모노이드로서의 어플리카티브

어플리카티브 펑터 역시 카테고리 이론에서 *lax monoidal functor*로 알려진 모노이드적 정식을 가집니다. 인터페이스를 모노이드로 구현하고 그로부터 `ap`를 복원할 수 있습니다:

```js
// concat :: f a -> f b -> f [a, b]
// empty :: () -> f ()

// ap :: Functor f => f (a -> b) -> f a -> f b
const ap = compose(map(([f, x]) => f(x)), concat);
```

## 요약

보시다시피 모든 것은 연결되어 있거나 연결될 수 있습니다. 이러한 깊은 깨달음은 *모노이드*를 광범위한 앱 아키텍처부터 아주 작은 데이터 조각에 이르기까지 강력한 모델링 도구로 만들어 줍니다. 애플리케이션에 직접적인 누적이나 결합이 포함될 때마다 *모노이드*를 떠올려 보시기 바랍니다.

## 연습문제

[부록 A: 필수 함수 지원](appendix_a.md)
