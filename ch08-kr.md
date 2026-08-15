# 08 장: 터퍼웨어 (Tupperware)

## 강력한 컨테이너

<img src="images/jar.jpg" alt="http://blog.dwinegar.com/2011/06/another-jar.html" />

우리는 일련의 순수 함수들을 통해 데이터를 파이프로 흘려보내는 프로그램을 작성하는 방법을 보았습니다. 이들은 동작에 대한 선언적인 명세입니다. 하지만 제어 흐름, 에러 처리, 비동기 작업, 상태, 그리고 감히 말하자면 부수효과(effects)는 어떻게 다루어야 할까요?! 이 장에서는 이러한 모든 유용한 추상화가 구축되는 기반을 발견하게 될 것입니다.

먼저 우리는 컨테이너를 만들 것입니다. 이 컨테이너는 모든 타입의 값을 담을 수 있어야 합니다. 타피오카 푸딩만 담을 수 있는 지퍼백은 별로 쓸모가 없으니까요. 이 컨테이너는 객체 형태를 띠지만 객체지향적인 의미의 프로퍼티나 메서드를 부여하지는 않을 것입니다. 아니요, 우리는 이를 보물 상자, 즉 우리의 소중한 데이터를 포근히 감싸 안는 특별한 상자처럼 다룰 것입니다.

```js
class Container {
  constructor(x) {
    this.$value = x;
  }
  
  static of(x) {
    return new Container(x);
  }
}
```

여기 우리의 첫 번째 컨테이너가 있습니다. 우리는 사려 깊게도 이 이름을 `Container`라고 지었습니다. 우리는 끔찍한 `new` 키워드를 사방에 쓰지 않기 위해 생성자 역할을 하는 `Container.of`를 사용할 것입니다. `of` 함수에는 눈에 보이는 것 이상의 의미가 있지만, 지금은 컨테이너에 값을 넣는 적절한 방법이라고 생각하세요.

우리의 새로운 상자를 살펴봅시다...

```js
Container.of(3);
// Container(3)

Container.of('hotdogs');
// Container("hotdogs")

Container.of(Container.of({ name: 'yoda' }));
// Container(Container({ name: 'yoda' }))
```

Node 환경을 사용 중이라면 `Container(x)` 대신 `{$value: x}`가 출력될 수 있습니다. Chrome은 타입을 올바르게 출력하겠지만 상관없습니다. `Container`가 어떻게 생겼는지만 이해하면 충분합니다. 원한다면 일부 환경에서 `inspect` 메서드를 오버라이드할 수도 있습니다. 이 책에서는 교육적인 이유와 시각적인 편의를 위해 `inspect`를 오버라이드한 것처럼 개념적인 출력을 표기할 것입니다.

다음으로 넘어가기 전에 몇 가지 점을 명확히 해둡시다:

* `Container`는 하나의 프로퍼티를 가진 객체입니다. 많은 컨테이너가 단 하나의 값만 담지만, 하나로 제한되는 것은 아닙니다. 우리는 임의로 그 프로퍼티 이름을 `$value`라고 지었습니다.
* `$value`는 특정 타입으로 한정될 수 없으며, 그렇지 않다면 `Container`라는 이름값을 하지 못할 것입니다.
* 데이터가 한 번 `Container` 안으로 들어가면 그 안에 머무릅니다. `.$value`를 사용해 꺼낼 *수도* 있겠지만, 그렇게 하면 컨테이너를 쓰는 목적이 사라집니다.

우리가 왜 이렇게 하는지는 투명한 유리병처럼 명확해지겠지만, 지금은 조금만 참아주세요.

## 나의 첫 번째 펑터

우리의 값이 컨테이너 안에 들어가면, 그 값을 대상으로 함수를 실행할 방법이 필요합니다.

```js
// (a -> b) -> Container a -> Container b
Container.prototype.map = function (f) {
  return Container.of(f(this.$value));
};
```

어머나, `[a]` 대신 `Container a`가 들어간 것만 빼면 배열의 유명한 `map`과 똑같지 않나요? 그리고 본질적으로 완전히 동일하게 동작합니다:

```js
Container.of(2).map(two => two + 2); 
// Container(4)

Container.of('flamethrowers').map(s => s.toUpperCase()); 
// Container('FLAMETHROWERS')

Container.of('bombs').map(append(' away')).map(prop('length')); 
// Container(10)
```

우리는 `Container`를 전혀 벗어나지 않고도 값을 다룰 수 있습니다. 이것은 매우 놀라운 일입니다. `Container` 안의 값은 `map` 함수에 넘겨져 조작된 후, 안전한 보관을 위해 다시 `Container`로 반환됩니다. `Container`를 결코 떠나지 않기 때문에, 우리는 원하는 대로 함수를 실행하면서 계속해서 `map`을 호출할 수 있습니다. 세 번째 예제처럼 진행하면서 타입을 바꿀 수도 있습니다.

잠깐만요, `map`을 계속 호출하는 것은 일종의 합성과 같아 보입니다! 여기에서 어떤 수학적 마법이 작용하고 있는 걸까요? 여러분, 우리는 방금 **펑터(Functor)**를 발견했습니다.

> 펑터는 `map`을 구현하고 몇 가지 법칙을 따르는 타입입니다.

그렇습니다. *펑터*는 단순히 규약(contract)을 가진 인터페이스일 뿐입니다. *Mappable*이라고 이름 붙일 수도 있었겠지만, 그러면 *fun(재미)*이 없잖아요? 펑터는 카테고리 이론에서 유래한 것이며 이 장의 마지막 부분에서 수학을 자세히 살펴보겠지만, 지금은 이 독특한 이름의 인터페이스에 대한 직관과 실용적인 용도에 집중해 봅시다.

도대체 값을 상자에 담아두고 `map`으로 접근하는 이유가 무엇일까요? 더 나은 질문을 던지면 답이 명확해집니다: 컨테이너에게 우리 대신 함수를 적용해 달라고 요청함으로써 우리가 얻는 것은 무엇일까요? 바로 **함수 적용의 추상화(abstraction of function application)**입니다. 우리가 함수를 `map`할 때, 우리는 컨테이너 타입에게 그 함수를 대신 실행해 달라고 요청하는 것입니다. 이는 참으로 매우 강력한 개념입니다.

## 슈뢰딩거의 Maybe

<img src="images/cat.png" alt="cool cat, need reference" />

`Container`는 다소 지루합니다. 실제로 이는 대개 `Identity`라고 불리며 우리의 `id` 함수와 거의 동일한 역할을 합니다(때가 되면 살펴볼 수학적 연결 고리가 있습니다). 하지만 매핑하는 동안 유용한 동작을 제공할 수 있는 고유한 `map` 함수를 가진 다른 펑터들, 즉 컨테이너 형태의 타입들이 존재합니다. 이제 하나 정의해 봅시다.

> 완전한 구현은 [부록 B](./appendix_b.md#Maybe)에 나와 있습니다.

```js
class Maybe {
  static of(x) {
    return new Maybe(x);
  }

  get isNothing() {
    return this.$value === null || this.$value === undefined;
  }

  constructor(x) {
    this.$value = x;
  }

  map(fn) {
    return this.isNothing ? this : Maybe.of(fn(this.$value));
  }

  inspect() {
    return this.isNothing ? 'Nothing' : `Just(${inspect(this.$value)})`;
  }
}
```

이제 `Maybe`는 `Container`와 매우 비슷해 보이지만 한 가지 작은 차이점이 있습니다: 전달받은 함수를 호출하기 전에 먼저 값이 존재하는지 확인한다는 점입니다. 이는 `map`을 호출할 때 성가신 `null`을 피해 가는 효과를 냅니다(학습을 위해 단순화된 구현입니다).

```js
Maybe.of('Malkovich Malkovich').map(match(/a/ig));
// Just(True)

Maybe.of(null).map(match(/a/ig));
// Nothing

Maybe.of({ name: 'Boris' }).map(prop('age')).map(add(10));
// Nothing

Maybe.of({ name: 'Dinah', age: 14 }).map(prop('age')).map(add(10));
// Just(24)
```

`null` 값에 함수를 매핑할 때 앱이 에러를 일으키며 폭발하지 않는다는 점에 주목하세요. `Maybe`가 함수를 적용할 때마다 매번 값을 꼼꼼히 확인해 주기 때문입니다.

이러한 점 표기법(dot syntax)도 훌륭하고 함수형이지만, 1부에서 언급한 이유로 우리는 포인트프리 스타일을 유지하고 싶습니다. 마침 `map`은 자신이 전달받은 어떤 펑터로든 작업을 위임할 수 있는 준비가 완벽히 되어 있습니다:

```js
// map :: Functor f => (a -> b) -> f a -> f b
const map = curry((f, anyFunctor) => anyFunctor.map(f));
```

덕분에 평소처럼 합성을 계속할 수 있고 `map`은 예상대로 동작합니다. ramda의 `map` 역시 마찬가지입니다. 설명이 필요할 때는 점 표기법을 사용하고, 편리할 때는 포인트프리 버전을 사용할 것입니다. 눈치채셨나요? 타입 시그니처에 은근슬쩍 추가 표기법을 도입했습니다. `Functor f =>`는 `f`가 반드시 펑터여야 함을 알려줍니다.

## 사용 사례

실전에서 우리는 대개 결과를 반환하지 못할 수 있는 함수에서 `Maybe`를 보게 됩니다.

```js
// safeHead :: [a] -> Maybe(a)
const safeHead = xs => Maybe.of(xs[0]);

// streetName :: Object -> Maybe String
const streetName = compose(map(prop('street')), safeHead, prop('addresses'));

streetName({ addresses: [] });
// Nothing

streetName({ addresses: [{ street: 'Shady Ln.', number: 4201 }] });
// Just('Shady Ln.')
```

`safeHead`는 일반적인 `head`와 같지만 타입 안전성이 추가되었습니다. 코드에 `Maybe`가 도입되면 흥미로운 일이 일어납니다. 우리는 은밀하게 숨어드는 `null` 값을 강제로 처리해야만 합니다. `safeHead` 함수는 실패할 가능성을 정직하고 솔직하게 드러내며, 이 사실을 알리기 위해 `Maybe`를 반환합니다. 게다가 값이 `Maybe` 객체 안에 꽁꽁 싸여 있기 때문에 원하는 값을 얻으려면 반드시 `map`을 써야 합니다. 본질적으로 이는 `safeHead` 함수 자체에 의해 강제되는 `null` 체크입니다. 이제 방심한 틈을 타 흉측한 `null`이 고개를 들이밀지 않을 것이라는 안도감 속에 밤에 발 뻗고 잘 수 있습니다. 이러한 API는 종이와 압정으로 만든 허술한 애플리케이션을 목재와 못으로 단단하게 업그레이드해 주며, 더 안전한 소프트웨어를 보장합니다.

때로는 실패를 명시적으로 알리기 위해 함수가 `Nothing`을 반환할 수도 있습니다. 예를 들면:

```js
// withdraw :: Number -> Account -> Maybe(Account)
const withdraw = curry((amount, { balance }) =>
  Maybe.of(balance >= amount ? { balance: balance - amount } : null));

// 이 함수는 가상의 함수입니다...
// updateLedger :: Account -> Account 
const updateLedger = account => account;

// remainingBalance :: Account -> String
const remainingBalance = ({ balance }) => `Your balance is $${balance}`;

// finishTransaction :: Account -> String
const finishTransaction = compose(remainingBalance, updateLedger);

// getTwenty :: Account -> Maybe(String)
const getTwenty = compose(map(finishTransaction), withdraw(20));

getTwenty({ balance: 200.00 }); 
// Just('Your balance is $180')

getTwenty({ balance: 10.00 });
// Nothing
```

잔고가 부족하면 `withdraw`는 도도하게 `Nothing`을 반환합니다. 이 함수 역시 자신의 까다로움을 전달하며 그 이후의 모든 작업에 `map`을 사용하도록 강제합니다. 차이점은 여기서 `null`이 의도적이었다는 것입니다. `Just('..')` 대신 실패를 알리는 `Nothing`을 돌려받고 우리 애플리케이션은 사실상 그 자리에서 멈춥니다. 주목해야 할 중요한 사실입니다: `withdraw`가 실패하면 `map`은 매핑된 함수들(`finishTransaction`)을 전혀 실행하지 않으므로 이후의 모든 연산을 차단합니다. 돈을 성공적으로 인출하지 못했다면 장부를 갱신하거나 새 잔액을 보여주지 않는 것이 맞기 때문에, 이는 정확히 우리가 의도한 동작입니다.

## 값 꺼내기

사람들이 자주 놓치는 점 중 하나는 항상 마지막 종착점이 존재한다는 것입니다. JSON을 전송하거나, 화면에 출력하거나, 파일 시스템을 수정하는 등의 부수효과를 일으키는 함수가 마지막에 있게 마련입니다. 우리는 `return`으로 출력을 세상에 전달할 수 없으며, 세상 밖으로 내보내려면 어떤 함수든 실행해야 합니다. 선불교의 화두처럼 표현할 수 있습니다: "프로그램에 관찰 가능한 효과가 없다면, 그 프로그램은 실제로 실행된 것인가?". 자기만족을 위해 올바르게 실행된 것일까요? 아마도 단지 몇 사이클을 소모하고 다시 잠에 빠져들 뿐일 것입니다...

우리 애플리케이션의 역할은 데이터를 가져오고, 변환하고, 작별 인사를 나눌 때까지 그 데이터를 품고 전달하는 것이며, 그 작별을 고하는 함수 역시 매핑될 수 있으므로 값은 컨테이너의 따뜻한 품을 떠날 필요가 없습니다. 실제로 흔히 저지르는 실수는 어떻게든 `Maybe`에서 값을 꺼내려고 하는 것입니다. 마치 안의 잠재적 값이 갑자기 구체화되어 모든 것이 해결될 것처럼 말이죠. 우리는 값이 존재하지 않아 제 운명을 다하지 못하는 코드의 분기일 수도 있음을 이해해야 합니다. 슈뢰딩거의 고양이처럼 우리의 코드는 동시에 두 가지 상태에 있으며 최종 함수에 도달할 때까지 그 사실을 유지해야 합니다. 이는 논리적 분기에도 불구하고 코드에 선형적인 흐름을 부여합니다.

하지만 탈출구가 있긴 합니다. 커스텀 값을 반환하고 계속 진행하고 싶다면 `maybe`라는 작은 도우미 함수를 사용할 수 있습니다.

```js
// maybe :: b -> (a -> b) -> Maybe a -> b
const maybe = curry((v, f, m) => {
  if (m.isNothing) {
    return v;
  }

  return f(m.$value);
});

// getTwenty :: Account -> String
const getTwenty = compose(maybe('You\'re broke!', finishTransaction), withdraw(20));

getTwenty({ balance: 200.00 }); 
// 'Your balance is $180.00'

getTwenty({ balance: 10.00 }); 
// 'You\'re broke!'
```

이제 우리는 고정된 기본값을 반환하거나(`finishTransaction`이 반환하는 타입과 동일함), `Maybe` 없이 기분 좋게 트랜잭션을 마무리할 수 있습니다. `maybe`를 통해 우리는 `if/else` 문의 동등한 표현을 목격하고 있으며, `map`을 명령형으로 비유하자면 `if (x !== null) { return f(x) }`에 해당합니다.

`Maybe`의 도입은 초기에 다소 불편함을 유발할 수 있습니다. Swift나 Scala 사용자라면 `Option(al)`이라는 이름으로 핵심 라이브러리에 내장되어 있어 무슨 말인지 아실 것입니다. 항상 `null` 체크를 다루도록 강요받을 때(값이 존재함을 100% 확신하는 순간에도), 다소 번거롭다고 느끼기 쉽습니다. 하지만 시간이 지나면 제2의 천성이 될 것이며 그 안전함에 감사하게 될 것입니다.

안전하지 않은 소프트웨어를 작성하는 것은 달걀 하나하나에 정성스럽게 파스텔칠을 한 다음 달리는 도로로 집어던지는 것과 같습니다. 아기 돼지 삼형제가 경고한 재료로 양로원을 짓는 것과 같죠. 함수에 안전장치를 마련하는 것은 큰 도움이 되며, `Maybe`가 바로 그 역할을 해줍니다.

실제 구현에서는 `Maybe`가 두 개의 타입(값이 있는 경우와 없는 경우)으로 나뉜다는 점을 언급해야겠습니다. 이를 통해 `map`의 매개변수성(parametricity)을 지킬 수 있어 `null`과 `undefined` 같은 값도 매핑될 수 있습니다. 대개 값에 대해 null 체크를 하는 `Maybe` 대신 `Some(x) / None` 또는 `Just(x) / Nothing`과 같은 타입을 보게 될 것입니다.

## 순수한 에러 처리

<img src="images/fists.jpg" alt="pick a hand... need a reference" />

충격적일 수도 있지만, `throw/catch`는 그리 순수하지 않습니다. 에러가 던져지면 출력 값을 반환하는 대신 비상벨을 울립니다! 함수는 침입한 입력을 상대로 방패와 창처럼 수천 개의 0과 1을 내뿜으며 공격을 퍼붓습니다. 새로운 친구 `Either`와 함께라면 입력에 전쟁을 선포하는 대신 정중한 메시지로 응답할 수 있습니다. 한번 살펴보시죠:

> 완전한 구현은 [부록 B](./appendix_b.md#Either)에 나와 있습니다.

```js
class Either {
  static of(x) {
    return new Right(x);
  }

  constructor(x) {
    this.$value = x;
  }
}

class Left extends Either {
  map(f) {
    return this;
  }

  inspect() {
    return `Left(${inspect(this.$value)})`;
  }
}

class Right extends Either {
  map(f) {
    return Either.of(f(this.$value));
  }

  inspect() {
    return `Right(${inspect(this.$value)})`;
  }
}

const left = x => new Left(x);
```

`Left`와 `Right`는 `Either`라는 추상 타입의 두 하위 클래스입니다. 사용법을 살펴봅시다:

```js
Either.of('rain').map(str => `b${str}`); 
// Right('brain')

left('rain').map(str => `It's gonna ${str}, better bring your umbrella!`); 
// Left('rain')

Either.of({ host: 'localhost', port: 80 }).map(prop('host'));
// Right('localhost')

left('rolls eyes...').map(prop('host'));
// Left('rolls eyes...')
```

`Left`는 사춘기 청소년처럼 우리의 `map` 요청을 매정하게 무시합니다. `Right`는 `Container`(일명 Identity)처럼 정상적으로 동작합니다. `Either`의 강력함은 `Left` 안에 에러 메시지를 담을 수 있다는 점에서 나옵니다.

성공하지 못할 수도 있는 함수를 가정해 봅시다. 생년월일로부터 나이를 계산한다고 해보죠. 실패를 알리고 프로그램을 분기하기 위해 `Nothing`을 사용할 수도 있지만, 많은 정보를 주지 못합니다. 왜 실패했는지 알고 싶을 것입니다. `Either`를 사용해 작성해 봅시다.

```js
const moment = require('moment');

// getAge :: Date -> User -> Either(String, Number)
const getAge = curry((now, user) => {
  const birthDate = moment(user.birthDate, 'YYYY-MM-DD');

  return birthDate.isValid()
    ? Either.of(now.diff(birthDate, 'years'))
    : left('Birth date could not be parsed');
});

getAge(moment(), { birthDate: '2005-12-12' });
// Right(9)

getAge(moment(), { birthDate: 'July 4, 2001' });
// Left('Birth date could not be parsed')
```

이제 `Nothing`과 마찬가지로 `Left`를 반환할 때 앱을 단락(short-circuit)시킵니다. 차이점은 이제 프로그램이 왜 탈선했는지에 대한 단서가 있다는 점입니다. `Either(String, Number)`를 반환하며 왼쪽 값으로 `String`을, `Right`로 `Number`를 담는다는 점에 주목하세요. 에러 메시지를 받거나 나이를 돌려받게 된다는 사실을 알려줍니다.

```js
// fortune :: Number -> String
const fortune = compose(concat('If you survive, you will be '), toString, add(1));

// zoltar :: User -> Either(String, _)
const zoltar = compose(map(console.log), map(fortune), getAge(moment()));

zoltar({ birthDate: '2005-12-12' });
// 'If you survive, you will be 10'
// Right(undefined)

zoltar({ birthDate: 'balloons!' });
// Left('Birth date could not be parsed')
```

`birthDate`가 유효하면 프로그램은 화면에 점괘를 출력합니다. 그렇지 않으면 에러 메시지가 담긴 `Left`를 건네받습니다. 이는 에러를 던진 것과 동일하게 작동하지만, 성질을 부리고 비명을 지르는 대신 차분하고 온화한 방식으로 동작합니다.

이 예제에서는 조건문의 중괄호를 기어오르는 대신 오른쪽에서 왼쪽으로 이어지는 하나의 선형적인 흐름으로 읽힙니다.

여기서 한 가지 짚고 넘어갈 점이 있습니다: `fortune` 함수는 이 예제에서 `Either`와 함께 사용되었음에도 불구하고 주변의 펑터에 대해 전혀 알지 못합니다. 이전 예제의 `finishTransaction`도 마찬가지였습니다. 호출 시점에 함수를 `map`으로 감싸면 비펑터 함수에서 펑터 함수로 변환됩니다. 우리는 이 과정을 **리프팅(lifting)**이라고 부릅니다. 함수는 일반 데이터 타입을 다루도록 작성한 후 필요에 따라 적절한 컨테이너로 *리프팅*하는 것이 훨씬 좋습니다. 이를 통해 더 단순하고 재사용 가능한 함수를 만들 수 있습니다.

`Either`는 유효성 검사 같은 일상적인 에러는 물론 파일 누락이나 소켓 단절 같은 심각한 에러에도 훌륭합니다.

`Maybe`와 마찬가지로 유사하게 동작하지만 두 개의 함수를 받는 작은 `either` 도우미 함수가 있습니다:

```js
// either :: (a -> c) -> (b -> c) -> Either a b -> c
const either = curry((f, g, e) => {
  let result;

  switch (e.constructor) {
    case Left:
      result = f(e.$value);
      break;

    case Right:
      result = g(e.$value);
      break;

    // No Default
  }

  return result;
});

// zoltar :: User -> _
const zoltar = compose(console.log, either(id, fortune), getAge(moment()));

zoltar({ birthDate: '2005-12-12' });
// 'If you survive, you will be 10'
// undefined

zoltar({ birthDate: 'balloons!' });
// 'Birth date could not be parsed'
// undefined
```

드디어 그 신비로운 `id` 함수의 쓰임새가 나타났습니다! `Left` 안의 값을 앵무새처럼 그대로 돌려주어 에러 메시지를 `console.log`로 전달합니다. 이제 완전히 다른 유형의 펑터로 넘어가 봅시다.

## 맥도날드 아저씨에게 효과가 있었네...

<img src="images/dominoes.jpg" alt="dominoes.. need a reference" />

순수성에 대한 장에서 우리는 순수 함수의 독특한 예제를 보았습니다. 부수효과를 포함하고 있지만 그 동작을 다른 함수로 감싸 순수하다고 불렀던 함수입니다:

```js
// getFromStorage :: String -> (_ -> String)
const getFromStorage = key => () => localStorage[key];
```

내부 구현을 다른 함수로 둘러싸지 않았다면 `getFromStorage`는 외부 환경에 따라 출력이 달라졌을 것입니다. 하지만 단단한 래퍼를 씌움으로써 입력당 항상 동일한 출력(호출 시 `localStorage`에서 특정 항목을 가져오는 함수)을 얻게 됩니다.

하지만 이것만으로는 그리 유용하지 않습니다. 포장 상자 속의 수집용 피규어처럼 실제로 가지고 놀 수가 없으니까요. 컨테이너 안으로 손을 뻗어 그 내용물을 다룰 수 있는 방법이 있다면 좋을 텐데요... `IO`의 등장입니다.

```js
class IO {
  static of(x) {
    return new IO(() => x);
  }

  constructor(fn) {
    this.$value = fn;
  }

  map(fn) {
    return new IO(compose(fn, this.$value));
  }

  inspect() {
    return `IO(${inspect(this.$value)})`;
  }
}
```

`IO`는 `$value`가 항상 함수라는 점에서 이전 펑터들과 다릅니다. 하지만 우리는 `$value`를 함수로 생각하지 않습니다. 그것은 구현 세부사항일 뿐입니다. `IO`는 비순수 작업을 함수 래퍼로 캡처하여 지연(delay)시킵니다. 따라서 우리는 `IO`가 래퍼 자체가 아니라 래핑된 작업의 반환 값을 담고 있다고 생각합니다. 이는 `of` 함수에서 분명하게 드러납니다: `IO(x)`를 원하지만 평가를 피하기 위해 `IO(() => x)`가 필요할 뿐입니다.

사용법을 살펴봅시다:

```js
// ioWindow :: IO Window
const ioWindow = new IO(() => window);

ioWindow.map(win => win.innerWidth);
// IO(1430)

ioWindow
  .map(prop('location'))
  .map(prop('href'))
  .map(split('/'));
// IO(['http:', '', 'localhost:8000', 'blog', 'posts'])

// $ :: String -> IO [DOM]
const $ = selector => new IO(() => document.querySelectorAll(selector));

$('#myDiv').map(head).map(div => div.innerHTML);
// IO('I am some inner html')
```

여기서 `ioWindow`는 즉시 `map`할 수 있는 실제 `IO`이고, `$`는 호출된 후 `IO`를 반환하는 함수입니다. `IO`에 대해 `map`을 수행할 때, 우리는 그 함수를 합성의 끝에 붙여 새로운 `$value`로 만듭니다. 매핑된 함수들은 즉시 실행되지 않고, 쓰러뜨리지 않으려 조심스레 도미노를 쌓듯이 연산의 끝에 차곡차곡 덧붙여집니다.

이제 맹수를 우리에 가두었지만 언젠가는 풀어주어야 합니다. 도대체 어디서 언제 방아쇠를 당길 수 있을까요? 부수효과를 실행하는 책임을 **호출 코드(caller)**에 넘기면 됩니다. 우리의 순수한 코드는 무결성을 유지하고 실제로 효과를 실행하는 책임은 호출자가 짊어지게 됩니다.

```js
// url :: IO String
const url = new IO(() => window.location.href);

// toPairs :: String -> [[String]]
const toPairs = compose(map(split('=')), split('&'));

// params :: String -> [[String]]
const params = compose(toPairs, last, split('?'));

// findParam :: String -> IO Maybe [String]
const findParam = key => map(compose(Maybe.of, find(compose(eq(key), head)), params), url);

// -- 비순수 호출 코드 ----------------------------------------------

// $value()를 호출하여 실행합니다!
findParam('searchTerm').$value();
// Just(['searchTerm', 'wafflehouse'])
```

`IO`의 `$value`는 수류탄의 안전핀과 같으며 호출자가 가장 공개적인 방식으로 뽑아야 합니다. 사용자에게 변동성을 상기시키기 위해 이 프로퍼티의 이름을 `unsafePerformIO`로 바꾸는 것이 좋습니다.

```js
class IO {
  constructor(io) {
    this.unsafePerformIO = io;
  }

  map(fn) {
    return new IO(compose(fn, this.unsafePerformIO));
  }
}
```

이제 호출 코드는 `findParam('searchTerm').unsafePerformIO()`가 됩니다.

## 비동기 태스크 (Asynchronous Tasks)

콜백은 지옥으로 향하는 좁은 나선형 계단입니다. 비동기 코드를 처리하는 훨씬 더 좋은 방법이 있으며, 그것은 "F"(Functor)로 시작합니다.

우리는 Quildreen Motta의 훌륭한 [Folktale](https://folktale.origamitower.com/) 라이브러리의 `Data.Task`를 사용할 것입니다. 사용 예제를 보시죠:

```js
// -- Node readFile 예제 ------------------------------------------

const fs = require('fs');

// readFile :: String -> Task Error String
const readFile = filename => new Task((reject, result) => {
  fs.readFile(filename, (err, data) => (err ? reject(err) : result(data)));
});

readFile('metamorphosis').map(split('\n')).map(head);
// Task('One morning, as Gregor Samsa was waking up from anxious dreams, he discovered that
// in bed he had been changed into a monstrous verminous bug.')

// -- jQuery getJSON 예제 -----------------------------------------

// getJSON :: String -> {} -> Task Error JSON
const getJSON = curry((url, params) => new Task((reject, result) => {
  $.getJSON(url, params, result).fail(reject);
}));

getJSON('/video', { id: 10 }).map(prop('title'));
// Task('Family Matters ep 15')

// -- 기본 최소 컨텍스트 ----------------------------------------

Task.of(3).map(three => three + 1);
// Task(4)
```

`reject`와 `result`는 각각 에러 및 성공 콜백입니다. 보시다시피 우리는 미래의 값에 대해 마치 손안에 있는 것처럼 단순히 `Task`에 `map`을 적용합니다.

Promise에 익숙하다면 `Task`를 Promise로, `map`을 `then`으로 생각할 수 있습니다. `IO`처럼 `Task`는 실행하기 전에 우리가 신호를 줄 때까지 묵묵히 기다립니다.

`Task`를 실행하려면 `fork` 메서드를 호출해야 합니다. 이는 `unsafePerformIO`처럼 동작하지만 스레드를 차단하지 않고 평가를 계속합니다.

```js
// -- 순수 애플리케이션 -------------------------------------------------
// blogPage :: Posts -> HTML
const blogPage = Handlebars.compile(blogTemplate);

// renderPage :: Posts -> HTML
const renderPage = compose(blogPage, sortBy(prop('date')));

// blog :: Params -> Task Error HTML
const blog = compose(map(renderPage), getJSON('/posts'));

// -- 비순수 호출 코드 ----------------------------------------------
blog({}).fork(
  error => $('#error').html(error.message),
  page => $('#main').html(page),
);

$('#spinner').show();
```

`fork`를 호출하면 `Task`는 포스트를 가져와 페이지를 렌더링하기 위해 달려갑니다. `fork`는 응답을 기다리지 않으므로 그동안 스피너를 보여줍니다. 제어 흐름이 얼마나 선형적인지 느껴보세요. 콜백과 에러 처리 블록 사이를 오갈 필요 없이 아래에서 위로, 오른쪽에서 왼쪽으로 읽기만 하면 됩니다.

## 이론 한 조각

앞서 언급했듯이 펑터는 카테고리 이론에서 유래했으며 몇 가지 법칙을 만족합니다:

```js
// 항등원 (identity)
map(id) === id;

// 합성 (composition)
compose(map(f), map(g)) === map(compose(f, g));
```

카테고리 이론에서 펑터는 한 카테고리의 대상(object)과 사상(morphism)을 가져와 다른 카테고리로 매핑합니다.

<img src="images/catmap.png" alt="Categories mapped" />

예를 들어 `Maybe`는 타입과 함수의 카테고리를 각 대상이 존재하지 않을 수 있고 각 사상이 `null` 체크를 갖는 카테고리로 매핑합니다.

다이어그램을 통해 사상과 해당 대상의 매핑을 시각화할 수도 있습니다:

<img src="images/functormap.png" alt="functor diagram" />

다이어그램이 가환(commute)한다는 것, 즉 화살표를 따라가면 어느 경로든 동일한 결과를 낸다는 것을 알 수 있습니다.

```js
// topRoute :: String -> Maybe String
const topRoute = compose(Maybe.of, reverse);

// bottomRoute :: String -> Maybe String
const bottomRoute = compose(map(reverse), Maybe.of);

topRoute('hi'); // Just('ih')
bottomRoute('hi'); // Just('ih')
```

펑터는 중첩될 수 있습니다:

```js
const nested = Task.of([Either.of('pillows'), left('no sleep for you')]);

map(map(map(toUpperCase)), nested);
// Task([Right('PILLOWS'), Left('no sleep for you')])
```

`map(map(map(f)))` 대신 펑터를 합성할 수도 있습니다:

```js
class Compose {
  constructor(fgx) {
    this.getCompose = fgx;
  }

  static of(fgx) {
    return new Compose(fgx);
  }

  map(fn) {
    return new Compose(map(map(fn), this.getCompose));
  }
}

const tmd = Task.of(Maybe.of('Rock over London'));
const ctmd = Compose.of(tmd);
const ctmd2 = map(append(', rock on, Chicago'), ctmd);
// Compose(Task(Just('Rock over London, rock on, Chicago')))

ctmd2.getCompose;
// Task(Just('Rock over London, rock on, Chicago'))
```

## 요약

우리는 몇 가지 다른 펑터들을 살펴보았지만 세상에는 무한히 많은 펑터가 있습니다. 트리, 리스트, 맵 같은 순회 가능한 자료구조는 물론 이벤트 스트림과 옵저버블도 모두 펑터입니다. 펑터는 우리 주변 어디에나 있으며 이 책 전반에 걸쳐 광범위하게 사용할 것입니다.

그렇다면 여러 개의 펑터 인자를 받는 함수를 호출하는 것은 어떨까요? 순서가 정해진 비순수 또는 비동기 작업 시퀀스는 어떻게 다룰까요? 다음 장에서 모나드를 살펴보며 본격적으로 알아보겠습니다.

## 연습문제

{% exercise %}
`add`와 `map`을 사용하여 펑터 내부의 값을 1 증가시키는 함수를 만드세요.

{% initial src="./exercises/ch08/exercise_a.js#L3;" %}
```js
// incrF :: Functor f => f Int -> f Int
const incrF = undefined;
```

{% solution src="./exercises/ch08/solution_a.js" %}
{% validation src="./exercises/ch08/validation_a.js" %}
{% context src="./exercises/support.js" %}
{% endexercise %}

---

다음 User 객체가 주어졌을 때:

```js
const user = { id: 2, name: 'Albert', active: true };
```

{% exercise %}
`safeProp`과 `head`를 사용하여 유저 이름의 첫 글자(initial)를 구하세요.

{% initial src="./exercises/ch08/exercise_b.js#L7;" %}
```js
// initial :: User -> Maybe String
const initial = undefined;
```

{% solution src="./exercises/ch08/solution_b.js" %}
{% validation src="./exercises/ch08/validation_b.js" %}
{% context src="./exercises/support.js" %}
{% endexercise %}

---

다음 도우미 함수들이 주어졌을 때:

```js
// showWelcome :: User -> String
const showWelcome = compose(append('Welcome '), prop('name'));

// checkActive :: User -> Either String User
const checkActive = function checkActive(user) {
  return user.active
    ? Either.of(user)
    : left('Your account is not active');
};
```

{% exercise %}
`checkActive`와 `showWelcome`을 사용하여 활성 사용자에게 접근을 허용하거나 에러를 반환하는 함수를 작성하세요.

{% initial src="./exercises/ch08/exercise_c.js#L15;" %}
```js
// eitherWelcome :: User -> Either String String
const eitherWelcome = undefined;
```

{% solution src="./exercises/ch08/solution_c.js" %}
{% validation src="./exercises/ch08/validation_c.js" %}
{% context src="./exercises/support.js" %}
{% endexercise %}

---

이제 다음 함수들을 고려해 봅시다:

```js
// validateUser :: (User -> Either String ()) -> User -> Either String User
const validateUser = curry((validate, user) => validate(user).map(_ => user));

// save :: User -> IO User
const save = user => new IO(() => ({ ...user, saved: true }));
```

{% exercise %}
사용자 이름이 3글자보다 긴지 검사하거나 에러 메시지를 반환하는 `validateName` 함수를 작성하세요. 그런 다음 유효성 검사가 통과했을 때 `either`, `showWelcome`, `save`를 사용하여 사용자를 가입시키고 환영하는 `register` 함수를 작성하세요.

`either`의 두 함수 인자는 동일한 타입을 반환해야 한다는 점을 기억하세요.

{% initial src="./exercises/ch08/exercise_d.js#L15;" %}
```js
// validateName :: User -> Either String ()
const validateName = undefined;

// register :: User -> IO String
const register = compose(undefined, validateUser(validateName));
```

{% solution src="./exercises/ch08/solution_d.js" %}
{% validation src="./exercises/ch08/validation_d.js" %}
{% context src="./exercises/support.js" %}
{% endexercise %}

[09 장: 모나드라는 이름의 양파](ch09-kr.md)
