# 09 장: 모나드라는 이름의 양파 (Monadic Onions)

## 포인트 펑터 팩토리

더 나아가기 전에 한 가지 고백할 것이 있습니다. 우리가 각 타입에 추가했던 `of` 메서드에 대해 제가 완전히 정직하지는 못했습니다. 사실 `of`는 `new` 키워드를 피하기 위한 것이 아니라, 값을 **기본 최소 컨텍스트(default minimal context)**에 넣기 위한 것입니다. 그렇습니다. `of`는 단순히 생성자를 대신하는 것이 아니라 우리가 **Pointed**라고 부르는 중요한 인터페이스의 일부입니다.

> *포인티드 펑터(Pointed Functor)*는 `of` 메서드를 가진 펑터입니다.

여기서 중요한 것은 어떤 값이든 타입 안으로 집어넣고 즉시 `map`을 시작할 수 있는 능력입니다.

```js
IO.of('tetris').map(concat(' master'));
// IO('tetris master')

Maybe.of(1336).map(add(1));
// Maybe(1337)

Task.of([{ id: 2 }, { id: 3 }]).map(map(prop('id')));
// Task([2,3])

Either.of('The past, present and future walk into a bar...').map(concat('it was tense.'));
// Right('The past, present and future walk into a bar...it was tense.')
```

기억하시겠지만 `IO`와 `Task`의 생성자는 함수를 인자로 받지만, `Maybe`와 `Either`는 그렇지 않습니다. 이 인터페이스의 동기는 생성자의 복잡성과 특정 요구사항 없이 펑터 안에 값을 일관되고 통일된 방식으로 넣기 위함입니다. "기본 최소 컨텍스트"라는 용어는 정확성은 조금 부족하지만 개념을 잘 담고 있습니다: 어떤 값이든 우리 타입으로 리프팅하여 평소처럼 해당 펑터의 예상 동작대로 `map`을 수행하고 싶다는 뜻입니다.

여기서 한 가지 짚고 넘어가자면 `Left.of`는 말이 되지 않습니다. 각 펑터는 내부에 값을 넣는 단 하나의 방법을 가져야 하며, `Either`의 경우 그것은 `new Right(x)`입니다. 만약 우리 타입이 `map`을 *할 수 있다면*, 당연히 `map`을 *해야 하기* 때문에 우리는 `Right`를 사용하여 `of`를 정의합니다. 위의 예제들을 보면 `of`가 보통 어떻게 동작하는지 직관을 얻을 수 있으며 `Left`는 그 틀을 벗어납니다.

`pure`, `point`, `unit`, `return`과 같은 함수 이름을 들어보셨을 수도 있습니다. 이들은 모두 미지의 만국 공통 함수인 `of` 메서드의 다양한 별칭입니다. `of`는 모나드를 사용하기 시작할 때 매우 중요해집니다. 앞으로 보겠지만 값을 수동으로 타입 안에 다시 넣는 것이 우리의 책임이기 때문입니다.

`folktale`, `ramda`, `fantasy-land`의 펑터 인스턴스들은 `new`에 의존하지 않는 훌륭한 생성자뿐만 아니라 올바른 `of` 메서드를 제공하므로 사용하는 것을 추천합니다.

## 은유 섞기

<img src="images/onion.png" alt="onion" />

우주 부리토(소문을 들으셨다면) 외에도 모나드는 양파와 같습니다. 흔히 발생하는 상황을 통해 보여드리겠습니다:

```js
const fs = require('fs');

// readFile :: String -> IO String
const readFile = filename => new IO(() => fs.readFileSync(filename, 'utf-8'));

// print :: String -> IO String
const print = x => new IO(() => {
  console.log(x);
  return x;
});

// cat :: String -> IO (IO String)
const cat = compose(map(print), readFile);

cat('.git/config');
// IO(IO('[core]\nrepositoryformatversion = 0\n'))
```

여기서 우리는 또 다른 `IO` 안에 갇힌 `IO`를 보게 됩니다. `print`가 `map` 도중에 두 번째 `IO`를 도입했기 때문입니다. 문자열로 계속 작업하려면 `map(map(f))`를 해야 하고 효과를 관찰하려면 `unsafePerformIO().unsafePerformIO()`를 해야 합니다.

```js
// cat :: String -> IO (IO String)
const cat = compose(map(print), readFile);

// catFirstChar :: String -> IO (IO String)
const catFirstChar = compose(map(map(head)), cat);

catFirstChar('.git/config');
// IO(IO('['))
```

두 가지 효과가 잘 포장되어 있는 것을 보는 것은 좋지만, 방호복을 두 겹 껴입고 작업하는 느낌이며 어색하고 불편한 API가 됩니다. 또 다른 상황을 살펴봅시다:

```js
// safeProp :: Key -> {Key: a} -> Maybe a
const safeProp = curry((x, obj) => Maybe.of(obj[x]));

// safeHead :: [a] -> Maybe a
const safeHead = safeProp(0);

// firstAddressStreet :: User -> Maybe (Maybe (Maybe Street))
const firstAddressStreet = compose(
  map(map(safeProp('street'))),
  map(safeHead),
  safeProp('addresses'),
);

firstAddressStreet({
  addresses: [{ street: { name: 'Mulburry', number: 8402 }, postcode: 'WC2N' }],
});
// Maybe(Maybe(Maybe({name: 'Mulburry', number: 8402})))
```

다시 한 번 중첩된 펑터 상황을 보게 됩니다. 세 번의 잠재적 실패를 확인하는 것은 깔끔하지만 호출자가 값에 접근하기 위해 세 번 `map`할 것을 기대하는 것은 무리입니다. 이 패턴은 계속해서 발생할 것이며 이것이 바로 밤하늘에 강력한 모나드 신호를 쏘아 올려야 하는 주된 상황입니다.

제가 모나드가 양파와 같다고 말한 이유는 내부 값에 접근하기 위해 `map`으로 중첩된 펑터의 각 레이어를 벗겨낼 때마다 눈물이 핑 돌기 때문입니다. 눈물을 닦고 숨을 깊게 들이쉰 다음 `join`이라는 메서드를 사용해 봅시다.

```js
const mmo = Maybe.of(Maybe.of('nunchucks'));
// Maybe(Maybe('nunchucks'))

mmo.join();
// Maybe('nunchucks')

const ioio = IO.of(IO.of('pizza'));
// IO(IO('pizza'))

ioio.join();
// IO('pizza')

const ttt = Task.of(Task.of(Task.of('sewers')));
// Task(Task(Task('sewers')));

ttt.join();
// Task(Task('sewers'))
```

동일한 타입의 레이어가 두 개 있다면 `join`을 통해 하나로 뭉갤 수 있습니다. 이렇게 서로 결합하는 능력, 즉 이 펑터의 결합이 모나드를 모나드로 만듭니다. 조금 더 정확한 정의로 다가가 봅시다:

> 모나드는 평탄화(flatten)할 수 있는 포인티드 펑터입니다.

`join` 메서드를 정의하고 `of` 메서드를 가지며 몇 가지 법칙을 따르는 모든 펑터는 모나드입니다. `Maybe`의 `join`을 정의해 봅시다:

```js
Maybe.prototype.join = function join() {
  return this.isNothing ? Maybe.of(null) : this.$value;
};
```

`Maybe(Maybe(x))`가 있다면 `.$value`가 불필요한 추가 레이어를 제거해주며 거기서부터 안전하게 `map`할 수 있습니다. 그렇지 않다면 애초에 아무것도 매핑되지 않았으므로 단 하나의 `Maybe`만 남게 됩니다.

이제 `firstAddressStreet` 예제에 `join`을 적용해 봅시다:

```js
// join :: Monad m => m (m a) -> m a
const join = mma => mma.join();

// firstAddressStreet :: User -> Maybe Street
const firstAddressStreet = compose(
  join,
  map(safeProp('street')),
  join,
  map(safeHead),
  safeProp('addresses'),
);

firstAddressStreet({
  addresses: [{ street: { name: 'Mulburry', number: 8402 }, postcode: 'WC2N' }],
});
// Maybe({name: 'Mulburry', number: 8402})
```

중첩된 `Maybe`가 통제를 벗어나지 않도록 마주칠 때마다 `join`을 추가했습니다. `IO`에도 동일하게 적용해 봅시다:

```js
IO.prototype.join = function join() {
  return this.unsafePerformIO();
};
```

단순히 한 레이어를 제거할 뿐입니다. 순수성을 버린 것이 아니라 단지 여분의 비닐 포장을 벗겨냈을 뿐입니다.

```js
// log :: a -> IO a
const log = x => new IO(() => {
  console.log(x);
  return x;
});

// setStyle :: Selector -> CSSProps -> IO DOM
const setStyle =
  curry((sel, props) => new IO(() => jQuery(sel).css(props)));

// getItem :: String -> IO String
const getItem = key => new IO(() => localStorage.getItem(key));

// applyPreferences :: String -> IO DOM
const applyPreferences = compose(
  join,
  map(setStyle('#main')),
  join,
  map(log),
  map(JSON.parse),
  getItem,
);

applyPreferences('preferences').unsafePerformIO();
// Object {backgroundColor: "green"}
// <div style="background-color: 'green'"/>
```

## 체인으로 이어지는 연쇄

<img src="images/chain.jpg" alt="chain" />

우리는 `map` 직후에 `join`을 호출하는 패턴을 자주 보게 됩니다. 이것을 `chain`이라는 함수로 추상화해 봅시다.

```js
// chain :: Monad m => (a -> m b) -> m a -> m b
const chain = curry((f, m) => m.map(f).join());

// 또는

// chain :: Monad m => (a -> m b) -> m a -> m b
const chain = f => compose(join, map(f));
```

이 map/join 콤보를 하나의 함수로 묶었습니다. 이전 글들에서 `chain`이 `>>=`(bind) 또는 `flatMap`으로 불리는 것을 보셨을 것입니다. JS 진영에서 널리 받아들여진 `chain`이라는 이름을 사용하겠습니다. 위의 두 예제를 `chain`으로 리팩토링해 봅시다:

```js
// chain을 사용한 firstAddressStreet
const firstAddressStreet = compose(
  chain(safeProp('street')),
  chain(safeHead),
  safeProp('addresses'),
);

// chain을 사용한 applyPreferences
const applyPreferences = compose(
  chain(setStyle('#main')),
  chain(log),
  map(JSON.parse),
  getItem,
);
```

`chain`은 부수효과를 자연스럽게 중첩하기 때문에 순수 함수형 방식으로 **순서(sequence)**와 **변수 할당(variable assignment)**을 모두 캡처할 수 있습니다.

```js
// getJSON :: Url -> Params -> Task JSON
getJSON('/authenticate', { username: 'stale', password: 'crackers' })
  .chain(user => getJSON('/friends', { user_id: user.id }));
// Task([{name: 'Seimith', id: 14}, {name: 'Ric', id: 39}]);

// querySelector :: Selector -> IO DOM
querySelector('input.username')
  .chain(({ value: uname }) =>
    querySelector('input.email')
      .chain(({ value: email }) => IO.of(`Welcome ${uname} prepare for spam at ${email}`))
  );
// IO('Welcome Olivia prepare for spam at olivia@tremorcontrol.net');

Maybe.of(3)
  .chain(three => Maybe.of(2).map(add(three)));
// Maybe(5);

Maybe.of(null)
  .chain(safeProp('address'))
  .chain(safeProp('street'));
// Maybe(null);
```

첫 번째 예제에서는 두 `Task`가 연속적인 비동기 작업으로 연결됩니다. 먼저 `user`를 가져온 다음 해당 유저의 ID로 친구들을 찾습니다. `Task(Task([Friend]))` 상황을 피하기 위해 `chain`을 사용했습니다.

두 번째 예제에서는 가장 안쪽 함수에서 `uname`과 `email` 모두에 접근할 수 있습니다. 이것이 바로 최상의 함수형 변수 할당입니다. `IO.of`를 사용해 값을 다시 원래 형태로 포장합니다.

일반 값을 반환할 때는 `map`을, 다른 펑터를 반환할 때는 `chain`을 사용한다는 점을 기억하세요.

## 강력한 위력

컨테이너 스타일 프로그래밍이 얼마나 강력한지 보여드리기 위해 모나드의 검을 휘둘러 보겠습니다.

파일을 읽은 다음 바로 업로드하는 예제입니다:

```js
// readFile :: Filename -> Either String (Task Error String)
// httpPost :: String -> String -> Task Error JSON
// upload :: String -> Either String (Task Error JSON)
const upload = compose(map(chain(httpPost('/uploads'))), readFile);
```

여기서 우리는 코드를 여러 번 분기하고 있습니다. 타입 시그니처를 보면 3가지 에러로부터 보호되고 있음을 알 수 있습니다: `readFile`은 `Either`를 사용해 입력을 검증하고, `Task`의 첫 번째 타입 파라미터로 파일 접근 시 발생할 수 있는 에러를 표현하며, 업로드 실패 가능성은 `httpPost`의 `Error`로 표현됩니다. 우리는 `chain`을 사용해 중첩되고 순차적인 두 비동기 작업을 매끄럽게 처리합니다.

이 모든 것이 왼쪽에서 오른쪽으로 흐르는 단 한 줄의 선형적인 흐름 안에서 이루어집니다. 순수하고 선언적이며 방정식적 추론이 가능합니다.

대조를 위해 표준적인 명령형 방식을 살펴보겠습니다:

```js
// upload :: String -> (String -> a) -> Void
const upload = (filename, callback) => {
  if (!filename) {
    throw new Error('You need a filename!');
  } else {
    readFile(filename, (errF, contents) => {
      if (errF) throw errF;
      httpPost('/uploads', contents, (errH, json) => {
        if (errH) throw errH;
        callback(json);
      });
    });
  }
};
```

변덕스러운 미로 속에 갇힌 꼴입니다. 도중에 변수를 변경하는 전형적인 앱이라면 진흙탕에 빠진 것과 다름없을 것입니다.

## 이론

첫 번째로 살펴볼 법칙은 결합법칙입니다:

```js
// 결합법칙 (associativity)
compose(join, map(join)) === compose(join, join);
```

이 법칙은 모나드의 중첩된 특성을 다루며, 내부 타입을 먼저 합치든 외부 타입을 먼저 합치든 동일한 결과를 얻는다는 점을 보여줍니다:

<img src="images/monad_associativity.png" alt="monad associativity law" />

두 번째 법칙은 항등원 법칙입니다:

```js
// 항등원 법칙 (identity)
compose(join, of) === compose(join, map(of)) === id;
```

어떤 모나드 `M`에 대해서도 `of`와 `join`을 합성하면 `id`가 된다는 것을 의미합니다.

<img src="images/triangle_identity.png" alt="monad identity law" />

항등원과 결합법칙... 이것은 바로 카테고리의 법칙입니다! 모나드는 모든 대상이 모나드이고 사상이 체인 함수들인 "클라이슬리 카테고리(Kleisli category)"를 형성합니다.

```js
const mcompose = (f, g) => compose(chain(f), g);

// 좌항등원
mcompose(M, f) === f;

// 우항등원
mcompose(f, M) === f;

// 결합법칙
mcompose(mcompose(f, g), h) === mcompose(f, mcompose(g, h));
```

## 요약

모나드를 사용하면 중첩된 연산 속으로 깊숙이 파고들 수 있습니다. 파멸의 피라미드에 벽돌 한 장 쌓지 않고도 변수를 할당하고, 순차적인 효과를 실행하고, 비동기 작업을 수행할 수 있습니다. 동일한 타입의 여러 레이어에 값이 갇혔을 때 모나드가 구하러 옵니다. 충직한 조수인 "포인티드"의 도움을 받아 모나드는 상자에서 꺼낸 값을 우리에게 빌려주고 작업이 끝나면 다시 상자에 넣을 수 있게 해줍니다.

다음 장에서는 어플리카티브 펑터(Applicative Functors)가 컨테이너 세상에 어떻게 들어맞는지, 그리고 왜 많은 경우 모나드보다 어플리카티브 펑터를 선호하는지 살펴보겠습니다.

## 연습문제

다음과 같은 User 객체를 고려해 봅시다:

```js
const user = {
  id: 1,
  name: 'Albert',
  address: {
    street: {
      number: 22,
      name: 'Walnut St',
    },
  },
};
```

{% exercise %}
유저가 주어졌을 때 `safeProp`과 `map/join` 또는 `chain`을 사용하여 안전하게 거리 이름을 가져오세요.

{% initial src="./exercises/ch09/exercise_a.js#L16;" %}
```js
// getStreetName :: User -> Maybe String
const getStreetName = undefined;
```

{% solution src="./exercises/ch09/solution_a.js" %}
{% validation src="./exercises/ch09/validation_a.js" %}
{% context src="./exercises/support.js" %}
{% endexercise %}

---

이제 다음 항목들을 고려해 봅시다:

```js
// getFile :: IO String
const getFile = IO.of('/home/mostly-adequate/ch09.md');

// pureLog :: String -> IO ()
const pureLog = str => new IO(() => console.log(str));
```

{% exercise %}
`getFile`을 사용하여 파일 경로를 얻고, 디렉토리를 제거하여 기본 파일명(basename)만 남긴 다음, 순수하게 로그를 출력하세요. 힌트: 파일 경로에서 기본 파일명을 얻기 위해 `split`과 `last`를 사용할 수 있습니다.

{% initial src="./exercises/ch09/exercise_b.js#L13;" %}
```js
// logFilename :: IO ()
const logFilename = undefined;
```

{% solution src="./exercises/ch09/solution_b.js" %}
{% validation src="./exercises/ch09/validation_b.js" %}
{% context src="./exercises/support.js" %}
{% endexercise %}

---

이 연습문제에서는 다음 시그니처를 가진 도우미 함수들을 고려합니다:

```js
// validateEmail :: Email -> Either String Email
// addToMailingList :: Email -> IO([Email])
// emailBlast :: [Email] -> IO ()
```

{% exercise %}
`validateEmail`, `addToMailingList`, `emailBlast`를 사용하여 이메일이 유효할 경우 메일링 리스트에 추가하고 전체 목록에 알림을 보내는 함수를 작성하세요.

{% initial src="./exercises/ch09/exercise_c.js#L11;" %}
```js
// joinMailingList :: Email -> Either String (IO ())
const joinMailingList = undefined;
```

{% solution src="./exercises/ch09/solution_c.js" %}
{% validation src="./exercises/ch09/validation_c.js" %}
{% context src="./exercises/support.js" %}
{% endexercise %}

[10 장: 어플리카티브 펑터](ch10-kr.md)
