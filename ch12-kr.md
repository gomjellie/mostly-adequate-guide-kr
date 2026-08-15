# 12 장: 트래버싱 더 스톤 (Traversing the Stone)

지금까지 우리는 사나운 [펑터](ch08-kr.md#나의-첫-번째-펑터)를 길들여 우리의 뜻대로 어떤 연산이든 수행하도록 다루어 보았습니다. 함수 [적용](ch10-kr.md)을 사용해 한 번에 여러 위험한 효과들을 저글링하며 결과를 모으는 화려한 마술도 보았습니다. 컨테이너들을 서로 [결합(join)](ch09-kr.md)하여 공기 중으로 사라지게 만드는 신기한 마술에 감탄하기도 했고, 부수효과들을 하나로 [합성](ch08-kr.md#이론-한-조각)해 보기도 했습니다. 그리고 가장 최근에는 눈앞에서 하나의 타입을 다른 타입으로 [자연스럽게 변환](ch11-kr.md)하는 기적을 보았습니다.

그리고 이제 다음 마술로 **트래버설(traversal, 순회)**을 살펴볼 차례입니다. 우리는 공중그네 곡예사처럼 타입들이 값을 온전히 보존한 채 서로의 위로 날아오르는 모습을 보게 될 것입니다. 회전목마의 궤도처럼 부수효과들의 순서를 재배치할 것입니다. 컨테이너들이 곡예사의 팔다리처럼 뒤엉켰을 때 이 인터페이스를 사용해 깔끔하게 풀어낼 수 있습니다. 순서가 바뀌면 효과도 달라집니다. 시작해 봅시다.

## 타입과 타입들

기묘한 상황을 마주해 봅시다:

```js
// readFile :: FileName -> Task Error String

// firstWords :: String -> String
const firstWords = compose(intercalate(' '), take(3), split(' '));

// tldr :: FileName -> Task Error String
const tldr = compose(map(firstWords), readFile);

map(tldr, ['file1', 'file2']);
// [Task('hail the monarchy'), Task('smash the patriarchy')]
```

여기서 우리는 여러 파일을 읽은 결과 쓸모없는 태스크 배열을 얻게 되었습니다. 이 각각의 태스크를 어떻게 `fork`해야 할까요? `[Task Error String]` 대신 타입을 뒤집어 `Task Error [String]`을 얻을 수 있다면 정말 좋을 것입니다. 그렇게 하면 제각각 도착하는 여러 미래의 값 대신 모든 결과를 담고 있는 단 하나의 미래 값을 얻게 되어 비동기 처리에 훨씬 수월해집니다.

또 다른 까다로운 상황을 보시죠:

```js
// getAttribute :: String -> Node -> Maybe String
// $ :: Selector -> IO Node

// getControlNode :: Selector -> IO (Maybe (IO Node))
const getControlNode = compose(map(map($)), map(getAttribute('aria-controls')), $);
```

서로 만나기를 갈망하는 `IO`들을 보세요. 둘을 `join`하여 뺨을 맞대고 춤추게 하고 싶지만, 안타깝게도 무도회의 감시관처럼 `Maybe`가 둘 사이에 끼어 있습니다. 여기서 최선의 방법은 각 타입의 위치를 서로 바꾸어 최종적으로 나란히 있게 만드는 것이며, 그렇게 하면 시그니처를 `IO (Maybe Node)`로 단순화할 수 있습니다.

## 타입 풍수지리

**트래버서블(Traversable)** 인터페이스는 영광스러운 두 함수인 `sequence`와 `traverse`로 구성됩니다.

`sequence`를 사용하여 타입을 재배치해 봅시다:

```js
sequence(List.of, Maybe.of(['the facts'])); // [Just('the facts')]
sequence(Task.of, new Map({ a: Task.of(1), b: Task.of(2) })); // Task(Map({ a: 1, b: 2 }))
sequence(IO.of, Either.of(IO.of('buckle my shoe'))); // IO(Right('buckle my shoe'))
sequence(Either.of, [Either.of('wing')]); // Right(['wing'])
sequence(Task.of, left('wing')); // Task(Left('wing'))
```

무슨 일이 일어났는지 보이시나요? 중첩된 타입이 무더운 여름밤의 가죽 바지처럼 안팎이 뒤집혔습니다. 내부 펑터가 바깥으로 나가고 외부 펑터가 안으로 들어왔습니다. `sequence`는 인자에 대해 다소 까다롭습니다:

```js
// sequence :: (Traversable t, Applicative f) => (a -> f a) -> t (f a) -> f (t a)
const sequence = curry((of, x) => x.sequence(of));
```

두 번째 인자부터 살펴보죠. 이것은 반드시 **어플리카티브(Applicative)**를 담고 있는 **트래버서블(Traversable)**이어야 합니다. `t (f a)`가 `f (t a)`로 바뀝니다. 두 타입이 서로 왈츠를 추듯 자리를 바꾸는 것이 명확하게 드러납니다. 첫 번째 인자는 정적 타입이 없는 언어에서만 필요한 도우미입니다. `Left`처럼 매핑을 꺼리는 타입을 뒤집기 위해 제공되는 타입 생성자(`of`)입니다.

`sequence`가 어떻게 동작하는지 `Either`의 구현을 통해 살펴봅시다:

```js
class Right extends Either {
  // ...
  sequence(of) {
    return this.$value.map(Either.of);
  }
}
```

`$value`가 펑터(실제로는 어플리카티브)라면, 단순히 우리의 생성자를 `map`하여 타입을 훌쩍 뛰어넘게 만들면 됩니다.

`Left`의 경우:

```js
class Left extends Either {
  // ...
  sequence(of) {
    return of(this);
  }
}
```

내부 어플리카티브를 실제로 가지고 있지 않은 `Left`와 같은 타입은 전달받은 `of`의 도움을 받아 `of(this)`를 반환합니다.

## 효과의 모음

컨테이너의 순서에 따라 결과가 달라집니다. `[Maybe a]`는 "가능한 값들의 컬렉션"인 반면, `Maybe [a]`는 "값들의 컬렉션의 존재 가능성"입니다. 전자는 너그럽게 "좋은 값들만 유지"함을 나타내고, 후자는 "전부 아니면 전무(all or nothing)" 상황을 의미합니다. 마찬가지로 `Either Error (Task Error a)`는 클라이언트 측 유효성 검사를, `Task Error (Either Error a)`는 서버 측 검사를 나타낼 수 있습니다. 타입을 맞바꾸어 서로 다른 효과를 얻을 수 있습니다.

```js
// fromPredicate :: (a -> Bool) -> a -> Either e a

// partition :: (a -> Bool) -> [a] -> [Either e a]
const partition = f => map(fromPredicate(f));

// validate :: (a -> Bool) -> [a] -> Either e [a]
const validate = f => traverse(Either.of, fromPredicate(f));
```

첫 번째 `partition`은 조건자 함수에 따라 `Left`와 `Right`의 배열을 반환합니다. 데이터를 버리지 않고 나중에 쓰기 위해 보관할 때 유용합니다. 반면 `validate`는 조건자를 통과하지 못한 첫 번째 항목을 `Left`로 반환하거나, 모두 통과하면 모든 항목을 담은 `Right`를 반환합니다. 타입의 순서를 다르게 선택함으로써 다른 동작을 얻게 됩니다.

`List`의 `traverse` 함수 구현을 살펴봅시다:

```js
traverse(of, fn) {
  return this.$value.reduce(
    (f, a) => fn(a).map(b => bs => bs.concat(b)).ap(f),
    of(new List([])),
  );
}
```

이 기적 같은 변환은 `of`, `map`, `ap`를 통해 단 몇 줄의 코드로 달성되며 모든 어플리카티브 펑터에서 작동합니다.

## 타입들의 왈츠

초기 예제들을 다시 방문하여 깔끔하게 정리해 봅시다:

```js
// readFile :: FileName -> Task Error String

// firstWords :: String -> String
const firstWords = compose(intercalate(' '), take(3), split(' '));

// tldr :: FileName -> Task Error String
const tldr = compose(map(firstWords), readFile);

traverse(Task.of, tldr, ['file1', 'file2']);
// Task(['hail the monarchy', 'smash the patriarchy']);
```

`map` 대신 `traverse`를 사용하여 다루기 힘들었던 `Task`들을 잘 정돈된 하나의 결과 배열로 모았습니다. `Promise.all()`과 비슷하지만, 특정 타입만을 위한 일회성 함수가 아니라 모든 *트래버서블* 타입에서 동작합니다.

두 번째 예제도 정리해 봅시다:

```js
// getAttribute :: String -> Node -> Maybe String
// $ :: Selector -> IO Node

// getControlNode :: Selector -> IO (Maybe Node)
const getControlNode = compose(chain(traverse(IO.of, $)), map(getAttribute('aria-controls')), $);
```

`map(map($))` 대신 `chain(traverse(IO.of, $))`를 사용하여 매핑하면서 타입을 뒤집은 다음 `chain`을 통해 두 `IO`를 평탄화했습니다.

## 법칙과 질서

법칙 없는 인터페이스는 단순한 우회(indirection)에 불과합니다. 트래버서블이 만족하는 법칙들을 살펴봅시다.

### 항등원 (Identity)

```js
const identity1 = compose(sequence(Identity.of), map(Identity.of));
const identity2 = Identity.of;

identity1(Either.of('stuff'));
// Identity(Right('stuff'))

identity2(Either.of('stuff'));
// Identity(Right('stuff'))
```

펑터 안에 `Identity`를 넣고 `sequence`로 뒤집는 것은 처음부터 외부에 배치하는 것과 같습니다.

### 합성 (Composition)

```js
const comp1 = compose(sequence(Compose.of), map(Compose.of));
const comp2 = (Fof, Gof) => compose(Compose.of, map(sequence(Gof)), sequence(Fof));

comp1(Identity(Right([true])));
// Compose(Right([Identity(true)]))

comp2(Either.of, Array)(Identity(Right([true])));
// Compose(Right([Identity(true)]))
```

이 법칙은 펑터들의 합성을 교환하더라도 합성 자체가 펑터이므로 일관되게 보존됨을 보장합니다. 이를 통해 순회 융합(fuse traversals)이 가능해져 성능 최적화에 도움이 됩니다.

### 자연성 (Naturality)

```js
const natLaw1 = (of, nt) => compose(nt, sequence(of));
const natLaw2 = (of, nt) => compose(sequence(of), map(nt));

// maybeToEither :: Maybe a -> Either () a
const maybeToEither = x => (x.$value ? new Right(x.$value) : new Left());

natLaw1(Maybe.of, maybeToEither)(Identity.of(Maybe.of('barlow one')));
// Right(Identity('barlow one'))

natLaw2(Either.of, maybeToEither)(Identity.of(Maybe.of('barlow one')));
// Right(Identity('barlow one'))
```

이 법칙의 당연한 귀결로 `traverse(A.of, A.of) === A.of`가 성립합니다.

## 요약

*Traversable*은 염력을 가진 인테리어 디자이너처럼 손쉽게 타입들을 재배치할 수 있게 해주는 강력한 인터페이스입니다. 순서를 바꾸어 다른 효과를 낼 수도 있고, 타입을 `join`하지 못하게 방해하던 주름들을 다림질하듯 펼 수도 있습니다. 다음 장에서는 앞으로 다루어질 더 높은 수준의 추상화들을 가볍게 살펴보겠습니다.

## 연습문제

다음 요소들을 고려해 봅시다:

```js
// httpGet :: Route -> Task Error JSON

// routes :: Map Route Route
const routes = new Map({ '/': '/', '/about': '/about' });
```

{% exercise %}
트래버서블 인터페이스를 사용하여 `getJsons`의 타입 시그니처를 `Map Route Route -> Task Error (Map Route JSON)`으로 변경하세요.

{% initial src="./exercises/ch12/exercise_a.js#L11;" %}
```js
// getJsons :: Map Route Route -> Map Route (Task Error JSON)
const getJsons = map(httpGet);
```

{% solution src="./exercises/ch12/solution_a.js" %}
{% validation src="./exercises/ch12/validation_a.js" %}
{% context src="./exercises/support.js" %}
{% endexercise %}

---

이제 다음 유효성 검사 함수를 정의합니다:

```js
// validate :: Player -> Either String Player
const validate = player => (player.name ? Either.of(player) : left('must have name'));
```

{% exercise %}
`validate` 함수와 트래버서블을 사용하여, 모든 플레이어가 유효할 때만 게임을 시작하도록 `startGame`(및 해당 시그니처)을 업데이트하세요.

{% initial src="./exercises/ch12/exercise_b.js#L7;" %}
```js
// startGame :: [Player] -> [Either Error String]
const startGame = compose(map(map(always('game started!'))), map(validate));
```

{% solution src="./exercises/ch12/solution_b.js" %}
{% validation src="./exercises/ch12/validation_b.js" %}
{% context src="./exercises/support.js" %}
{% endexercise %}

---

마지막으로 파일 시스템 도우미들을 고려합니다:

```js
// readfile :: String -> String -> Task Error String
// readdir :: String -> Task Error [String]
```

{% exercise %}
트래버서블을 사용하여 중첩된 Task들과 Maybe를 재배치하고 평탄화하세요.

{% initial src="./exercises/ch12/exercise_c.js#L8;" %}
```js
// readFirst :: String -> Task Error (Maybe (Task Error String))
const readFirst = compose(map(map(readfile('utf-8'))), map(safeHead), readdir);
```

{% solution src="./exercises/ch12/solution_c.js" %}
{% validation src="./exercises/ch12/validation_c.js" %}
{% context src="./exercises/support.js" %}
{% endexercise %}

[13 장: 무슨 일이 일어났을까...](ch13-kr.md)
