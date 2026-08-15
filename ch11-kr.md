# 11 장: 다시 변환하기, 자연스럽게 (Transform Again, Naturally)

우리는 이제 일상적인 코드에서의 실용적인 유용성이라는 맥락에서 **자연 변환(natural transformation)**에 대해 논의하려고 합니다. 마침 자연 변환은 카테고리 이론의 기둥이자 수학을 적용하여 코드를 추론하고 리팩토링할 때 절대적으로 없어서는 안 될 요소입니다. 시작해 봅시다.

## 중첩의 저주

중첩(nesting) 문제를 다루어 보겠습니다. 여기서 *중첩*이란 두 개 이상의 서로 다른 타입들이 하나의 값을 마치 갓난아기처럼 감싸 안고 한데 모여 있는 상태를 의미합니다.

```js
Right(Maybe('b'));

IO(Task(IO(1000)));

[Identity('bee thousand')];
```

지금까지 우리는 정교하게 만들어진 예제들을 통해 이러한 흔한 시나리오를 피해 왔지만, 실제로 코딩을 하다 보면 타입들은 엉킨 이어폰 줄처럼 스스로 꼬여버리기 일쑤입니다. 진행하면서 타입을 꼼꼼하게 정리해 두지 않으면 코드는 걷잡을 수 없이 지저분해집니다.

## 시트콤 한 편

```js
// getValue :: Selector -> Task Error (Maybe String)
// postComment :: String -> Task Error Comment
// validate :: String -> Either ValidationError String

// saveComment :: () -> Task Error (Maybe (Either ValidationError (Task Error Comment)))
const saveComment = compose(
  map(map(map(postComment))),
  map(map(validate)),
  getValue('#comment'),
);
```

타입 시그니처가 경악할 만한 녀석들이 모두 모였습니다. 코드를 간단히 설명하자면, 요소의 텍스트를 가져오는 `getValue('#comment')`로 사용자 입력을 받습니다. 요소를 찾는 데 실패하거나 텍스트가 없을 수도 있으므로 `Task Error (Maybe String)`을 반환합니다. 그 후 텍스트를 `validate`에 전달하기 위해 `Task`와 `Maybe` 모두에 `map`을 해야 하며, 이는 다시 `Either ValidationError String`을 반환합니다. 그런 다음 현재의 `Task Error (Maybe (Either ValidationError String))` 안의 `String`을 `postComment`로 보내기 위해 며칠 밤낮으로 `map`을 수행하여 결과 `Task`를 얻습니다.

정말 끔찍한 난장판입니다. 이 흔한 문제에는 여러 해결책이 있습니다. 타입들을 하나의 거대한 컨테이너로 합성하거나, 몇 개를 정렬하고 `join`하거나, 균일화(homogenize)하거나, 분해할 수 있습니다. 이 장에서는 **자연 변환**을 통해 이들을 균일화하는 데 집중할 것입니다.

## 완전히 자연스러운

**자연 변환(Natural Transformation)**이란 "펑터 간의 사상(morphism between functors)", 즉 컨테이너 자체에 작용하는 함수입니다. 타입 시그니처로는 `(Functor f, Functor g) => f a -> g a` 형태의 함수입니다. 특별한 점은 어떤 이유로든 펑터 안의 내용을 엿볼 수 없다는 점입니다. "일급 비밀"이 찍힌 봉인된 서류 봉투에 무엇이 들어있는지 두 당사자 모두 모른 채 정보를 교환하는 것으로 생각하세요. 이것은 구조적인 작업입니다. 펑터의 의상 갈아입히기라고 볼 수 있습니다. 형식적으로 *자연 변환*은 다음이 성립하는 모든 함수입니다:

<img width=600 src="images/natural_transformation.png" alt="natural transformation diagram" />

코드로는 다음과 같습니다:

```js
// nt :: (Functor f, Functor g) => f a -> g a
compose(map(f), nt) === compose(nt, map(f));
```

다이어그램과 코드 모두 동일한 내용을 말합니다: 자연 변환을 먼저 실행한 후 `map`을 하든, `map`을 먼저 한 후 자연 변환을 실행하든 동일한 결과를 얻습니다.

## 원칙에 기반한 타입 변환

프로그래머로서 우리는 타입 변환에 익숙합니다. 우리는 `String`을 `Boolean`으로, `Integer`를 `Float`로 변환합니다. 여기서의 차이점은 우리가 대수적 컨테이너를 다루고 있으며 활용할 수 있는 이론이 있다는 점뿐입니다.

몇 가지 예를 살펴보겠습니다:

```js
// idToMaybe :: Identity a -> Maybe a
const idToMaybe = x => Maybe.of(x.$value);

// idToIO :: Identity a -> IO a
const idToIO = x => IO.of(x.$value);

// eitherToTask :: Either a b -> Task a b
const eitherToTask = either(Task.rejected, Task.of);

// ioToTask :: IO a -> Task () a
const ioToTask = x => new Task((reject, resolve) => resolve(x.unsafePerform()));

// maybeToTask :: Maybe a -> Task () a
const maybeToTask = x => (x.isNothing ? Task.rejected() : Task.of(x.$value));

// arrayToMaybe :: [a] -> Maybe a
const arrayToMaybe = x => Maybe.of(x[0]);
```

원리가 보이시나요? 우리는 단지 하나의 펑터를 다른 펑터로 바꾸고 있을 뿐입니다. `map`할 값이 형태 변환 과정에서 유실되지만 않는다면 도중에 정보를 잃어버려도 괜찮습니다. 핵심은 변환 후에도 정의에 따라 `map`이 계속 유지되어야 한다는 점입니다.

이를 바라보는 한 가지 방법은 우리가 부수효과를 변환하고 있다는 것입니다. 그런 관점에서 `ioToTask`는 동기를 비동기로 변환하는 것으로, `arrayToMaybe`는 비결정론(nondeterminism)을 실패 가능성으로 변환하는 것으로 볼 수 있습니다. 자바스크립트에서는 비동기를 동기로 변환할 수 없으므로 `taskToIO`는 작성할 수 없습니다(그것은 초자연적인 변환이 될 것입니다).

## 기능 욕심

`List`의 `sortBy`와 같은 다른 타입의 기능을 사용하고 싶다고 가정해 봅시다. *자연 변환*은 `map`이 올바르게 유지된다는 확신을 가지고 대상 타입으로 변환할 수 있는 훌륭한 방법을 제공합니다.

```js
// arrayToList :: [a] -> List a
const arrayToList = List.of;

const doListyThings = compose(sortBy(h), filter(g), arrayToList, map(f));
const doListyThings_ = compose(sortBy(h), filter(g), map(f), arrayToList); // 법칙 적용
```

`arrayToList`를 넣기만 하면 우리의 `[a]`는 `List a`가 되어 원하는 대로 `sortBy`를 할 수 있습니다. 또한 `doListyThings_`처럼 `map(f)`를 자연 변환의 왼쪽으로 이동시켜 연산을 최적화/융합하기가 더 쉬워집니다.

## 동형 자바스크립트 (Isomorphic JavaScript)

정보를 전혀 잃지 않고 완전히 양방향으로 오갈 수 있을 때, 이를 **동형(isomorphism)**이라고 합니다. 이는 단지 "동일한 데이터를 담고 있다"는 화려한 표현일 뿐입니다. "출발"과 "도착"의 두 *자연 변환*을 증거로 제시할 수 있다면 두 타입은 *동형*이라고 말합니다:

```js
// promiseToTask :: Promise a b -> Task a b
const promiseToTask = x => new Task((reject, resolve) => x.then(resolve).catch(reject));

// taskToPromise :: Task a b -> Promise a b
const taskToPromise = x => new Promise((resolve, reject) => x.fork(reject, resolve));

const x = Promise.resolve('ring');
taskToPromise(promiseToTask(x)) === x;

const y = Task.of('rabbit');
promiseToTask(taskToPromise(y)) === y;
```

증명 완료(Q.E.D.). `Promise`와 `Task`는 *동형*입니다. 반면 `arrayToMaybe`는 정보를 잃어버리므로 *동형*이 아닙니다:

```js
// maybeToArray :: Maybe a -> [a]
const maybeToArray = x => (x.isNothing ? [] : [x.$value]);

// arrayToMaybe :: [a] -> Maybe a
const arrayToMaybe = x => Maybe.of(x[0]);

const x = ['elvis costello', 'the attractions'];

// 동형이 아닙니다
maybeToArray(arrayToMaybe(x)); // ['elvis costello']

// 하지만 자연 변환입니다
compose(arrayToMaybe, map(replace('elvis', 'lou')))(x); // Just('lou costello')
// ==
compose(map(replace('elvis', 'lou'), arrayToMaybe))(x); // Just('lou costello')
```

어느 쪽에서든 `map`의 결과가 같으므로 이들은 분명 *자연 변환*입니다.

## 더 넓은 정의

이러한 구조적 함수들은 타입 변환에만 국한되지 않습니다:

```hs
reverse :: [a] -> [a]

join :: (Monad m) => m (m a) -> m a

head :: [a] -> a

of :: a -> f a
```

자연 변환 법칙은 이 함수들에도 성립합니다.

## 중첩을 해결하는 한 가지 방법

앞서 보았던 시트콤 같은 타입 시그니처로 돌아가 봅시다. 우리는 호출 코드 전체에 *자연 변환*을 살짝 뿌려 서로 다른 타입들을 일관되게 강제하고 `join`할 수 있게 만들 수 있습니다.

```js
// getValue :: Selector -> Task Error (Maybe String)
// postComment :: String -> Task Error Comment
// validate :: String -> Either ValidationError String

// saveComment :: () -> Task Error Comment
const saveComment = compose(
  chain(postComment),
  chain(eitherToTask),
  map(validate),
  chain(maybeToTask),
  getValue('#comment'),
);
```

우리는 단순히 `chain(maybeToTask)`와 `chain(eitherToTask)`를 추가했습니다. 둘 다 동일한 효과를 냅니다. `Task`가 품고 있는 펑터를 자연스럽게 또 다른 `Task`로 변환한 다음 두 `Task`를 `join`합니다. 창틀의 비둘기 퇴치 스파이크처럼 근원지에서 중첩을 방지합니다.

## 요약

*자연 변환*은 펑터 자체에 작용하는 함수입니다. 카테고리 이론에서 매우 중요한 개념입니다. 우리가 살펴보았듯이, 합성이 유지된다는 보장을 바탕으로 타입을 변환하여 서로 다른 효과를 달성할 수 있습니다. 또한 중첩된 타입을 다루는 데 도움을 주지만, 펑터들을 가장 변동성이 큰 부수효과를 가진 펑터(대부분의 경우 `Task`)라는 최소공분모로 균일화하는 경향이 있습니다.

다음 장에서는 *Traversable*을 사용하여 타입의 순서를 바꾸는 방법을 살펴보겠습니다.

## 연습문제

{% exercise %}
`Either b a`를 `Maybe a`로 변환하는 자연 변환을 작성하세요.

{% initial src="./exercises/ch11/exercise_a.js#L3;" %}
```js
// eitherToMaybe :: Either b a -> Maybe a
const eitherToMaybe = undefined;
```

{% solution src="./exercises/ch11/solution_a.js" %}
{% validation src="./exercises/ch11/validation_a.js" %}
{% context src="./exercises/support.js" %}
{% endexercise %}

---

```js
// eitherToTask :: Either a b -> Task a b
const eitherToTask = either(Task.rejected, Task.of);
```

{% exercise %}
`eitherToTask`를 사용하여 중첩된 `Either`를 제거하도록 `findNameById`를 단순화하세요.

{% initial src="./exercises/ch11/exercise_b.js#L6;" %}
```js
// findNameById :: Number -> Task Error (Either Error User)
const findNameById = compose(map(map(prop('name'))), findUserById);
```

{% solution src="./exercises/ch11/solution_b.js" %}
{% validation src="./exercises/ch11/validation_b.js" %}
{% context src="./exercises/support.js" %}
{% endexercise %}

---

연습문제 컨텍스트에서 다음 함수들을 사용할 수 있습니다:

```hs
split :: String -> String -> [String]
intercalate :: String -> [String] -> String
```

{% exercise %}
String과 [Char] 사이의 동형(isomorphism)을 작성하세요.

{% initial src="./exercises/ch11/exercise_c.js#L8;" %}
```js
// strToList :: String -> [Char]
const strToList = undefined;

// listToStr :: [Char] -> String
const listToStr = undefined;
```

{% solution src="./exercises/ch11/solution_c.js" %}
{% validation src="./exercises/ch11/validation_c.js" %}
{% context src="./exercises/support.js" %}
{% endexercise %}

[12 장: 트래버싱 더 스톤](ch12-kr.md)
