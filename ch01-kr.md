# 01 장: 우리는 무엇을 하고 있나?

## 소개

안녕하세요, 저는 Franklin Frisby 교수입니다. 만나서 반갑습니다. 여러분과 함께 함수형 프로그래밍에 대해 알아보겠습니다. 그런데 여러분은 어떤 분들이신가요? 저는 여러분이 최소한 자바스크립트에 친숙하고 객체지향 프로그래밍 경험이 조금 있기를 바랍니다. 그리고 스스로를 프로그래머라고 생각하고 있기를 바랍니다. 곤충학 박사가 아니어도 되지만 소프트웨어의 버그(bug)를 찾고 잡는 법은 알고 있어야 합니다.

저는 여러분이 이미 함수형 프로그래밍을 알고 있다고 가정하지는 않겠습니다. 그렇게 넘겨짚으면 어떻게 되는지 우리 모두 잘 알고 있으니까요. 하지만 변경 가능한 상태(mutable state), 통제되지 않는 부수효과(side effects), 원칙 없는 설계가 만들어내는 고통스러운 상황을 겪어보셨기를 기대합니다. 이제 서로 충분히 알게 된 것 같으니 본격적으로 시작해 봅시다.

이 장에서는 앞으로 우리가 무엇을 배우게 될지 큰 그림을 보여드리겠습니다. 무엇이 **함수형** 프로그램을 만드는지에 대해 어느 정도 감을 잡아야 이후의 내용을 제대로 이해할 수 있습니다. 그렇지 않으면 목적을 잃고 헤매게 되고, 책을 읽으려는 노력이 무용지물이 될 테니까요. 우리에게는 코드를 바라볼 맑은 눈과 바다가 거칠어졌을 때 방향을 잡아줄 천체 나침반이 필요합니다.

개발할 때 막막한 어둠을 밝혀주는 몇 가지 프로그래밍 원칙들이 있습니다. DRY(반복하지 마라, Don't Repeat Yourself), YAGNI(필요할 때 만들어라, Ya Ain't Gonna Need It), 느슨한 결합과 높은 응집도(Loose Coupling & High Cohesion), 최소 놀람의 원칙(Principle of Least Astonishment), 단일 책임 원칙(Single Responsibility Principle) 등등...

제가 수년간 들어온 모든 격언들을 늘어놓으며 여러분을 지루하게 하지는 않겠습니다. 중요한 것은 이러한 원칙들이 함수형 프로그래밍에서도 여전히 유효하다는 점입니다. 앞으로 더 나아가기 전에, 우리가 코드를 작성할 때 도달하고자 하는 이상향, 즉 함수형 프로그래밍의 무릉도원을 여러분이 온전히 느껴보셨으면 좋겠습니다.

<!--BREAK-->

## 짧은 만남

여기 갈매기 떼(Flock) 프로그램이 있습니다. 조금 기묘하게 보일 수도 있습니다. 무리들이 합쳐지면(conjoin) 더 큰 무리가 되고, 번식하면(breed) 다른 무리의 수만큼 곱해집니다. 좋은 객체지향 코드는 아니지만, 가변 상태 할당에 기반한 접근 방식이 얼마나 위험한지 보여주기 위한 예제입니다. 한번 살펴보시죠:

```js
class Flock {
  constructor(n) {
    this.seagulls = n;
  }

  conjoin(other) {
    this.seagulls += other.seagulls;
    return this;
  }

  breed(other) {
    this.seagulls = this.seagulls * other.seagulls;
    return this;
  }
}

const flockA = new Flock(4);
const flockB = new Flock(2);
const flockC = new Flock(0);
const result = flockA
  .conjoin(flockC)
  .breed(flockB)
  .conjoin(flockA.breed(flockB)).seagulls;
// 32
```

도대체 누가 이런 코드를 짜겠냐고요? 내부 상태 변화를 추적하기가 너무나 어렵습니다. 게다가 세상에, 결과값마저 틀렸습니다! 정답은 `16`이어야 하지만, `flockA`가 중간에 변경되면서 계산이 꼬여버렸습니다. 불쌍한 `flockA`... 이것이 바로 상태 변이가 낳은 난세이자 야생의 수학입니다!

이 프로그램을 한눈에 이해하지 못해도 괜찮습니다. 저도 헷갈리니까요. 기억해야 할 핵심은 이렇게 작은 예제에서도 상태와 가변 값(mutable values)은 추적하기가 매우 힘들다는 점입니다.

이번에는 함수형 프로그래밍의 접근 방식을 사용하여 다시 작성해 볼까요?

```js
const conjoin = (flockX, flockY) => flockX + flockY;
const breed = (flockX, flockY) => flockX * flockY;

const flockA = 4;
const flockB = 2;
const flockC = 0;
const result = conjoin(
  breed(flockB, conjoin(flockA, flockC)),
  breed(flockA, flockB)
);
// 16
```

와, 이번에는 훨씬 적은 코드로 올바른 답을 얻었습니다. 함수가 중첩되어 조금 헷갈릴 수는 있지만(5장에서 이 문제를 우아하게 해결할 것입니다), 훨씬 깔끔해졌습니다. 여기서 한 걸음 더 나아가 볼까요? 사물을 있는 그대로 부르는 것에는 분명한 이점이 있습니다. 자세히 살펴보면 이 함수들은 그저 덧셈(`conjoin`)과 곱셈(`breed`)을 하고 있을 뿐입니다.

이 두 함수에는 이름 외에는 특별한 점이 전혀 없습니다. 함수들의 이름을 `add`와 `multiply`로 바꾸어 본래의 정체를 드러내 봅시다:

```js
const add = (x, y) => x + y;
const multiply = (x, y) => x * y;

const flockA = 4;
const flockB = 2;
const flockC = 0;
const result = add(
  multiply(flockB, add(flockA, flockC)),
  multiply(flockA, flockB)
);
// 16
```

이렇게 하면 우리가 아주 오래전부터 알고 있던 수학적 지식을 그대로 활용할 수 있습니다:

```js
// 결합법칙 (associative)
add(add(x, y), z) === add(x, add(y, z));

// 교환법칙 (commutative)
add(x, y) === add(y, x);

// 항등원 (identity)
add(x, 0) === x;

// 분배법칙 (distributive)
multiply(x, add(y, z)) === add(multiply(x, y), multiply(x, z));
```

이 오래되고 믿음직한 수학 성질들은 곧 손에 익게 될 것입니다. 지금 당장 기억나지 않아도 걱정하지 마세요. 우리 대부분은 이 산수 법칙들을 배운 지 꽤 오랜 시간이 흘렀으니까요. 이 법칙들을 이용해 우리의 작은 갈매기 프로그램을 얼마나 간단하게 만들 수 있는지 볼까요?

```js
// 기존 코드
add(multiply(flockB, add(flockA, flockC)), multiply(flockA, flockB));

// 항등원 적용하여 불필요한 덧셈 제거: add(flockA, flockC) == flockA (flockC가 0이므로)
add(multiply(flockB, flockA), multiply(flockA, flockB));

// 분배법칙 적용
multiply(flockB, add(flockA, flockA));
```

놀랍지 않나요! 우리는 함수 호출 이외에 불필요한 코드를 전혀 쓸 필요가 없었습니다. `add`와 `multiply`를 제공하는 라이브러리가 있다면 구현조차 직접 할 필요가 없습니다.

아마 여러분은 "이런 수학적인 예제는 실제 프로그래밍과는 다른 인위적인 장난이 아닌가요?"라거나 "실제 프로그램은 이렇게 단순하지 않아서 이런 식으로 생각할 수 없어요"라고 생각할지도 모릅니다. 하지만 덧셈과 곱셈은 우리 모두가 알고 있는 친숙한 개념이고, 수학이 얼마나 유용한지 보여주기 쉬워 이 예제를 선택한 것뿐입니다.

실망하지 마세요. 이 책을 읽는 동안 우리는 약간의 카테고리 이론(category theory), 집합론, 람다 대수(lambda calculus)를 탐험할 것입니다. 그리고 갈매기 프로그램 예제처럼 실제 세상의 복잡한 문제들을 간단하고 우아하게 풀어낼 것입니다. 여러분이 수학자일 필요는 전혀 없습니다. 함수형 프로그래밍이 일반적인 프레임워크나 API를 사용하는 것만큼이나 쉽고 자연스럽게 느껴질 테니까요.

모든 애플리케이션을 위와 같은 함수형 코드로 작성할 수 있다는 사실을 알게 되면 놀라실 것입니다. 견고한 성질을 가지고 적은 코드로 명확하게 표현할 수 있으며, 매번 바퀴를 재발명하지 않는 프로그램을 작성할 수 있습니다.

우리는 모든 조각이 서로 딱 들어맞는 정교한 이론을 원합니다. 특정한 문제를 일반적이고 조합 가능한 조각으로 표현하고, 이를 우리 자신의 문제를 해결하는 데 활용하고 싶어질 것입니다. 명령형 프로그램의 "무엇이든 가능한" 무규칙 접근방식보다는 원칙 있고 규율 있는 접근방식을 취할 것입니다. 탄탄한 수학적 프레임워크 안에서 코딩하는 경험은 여러분을 진실로 감탄하게 만들 것입니다.

우리는 함수형 세계의 북극성이 반짝이는 것을 잠깐 엿보았지만, 본격적인 여정을 시작하기 전에 알아야 할 구체적인 개념들이 몇 가지 있습니다.

[02 장: 일급 함수](ch02-kr.md)
