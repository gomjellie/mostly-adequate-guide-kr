# 02 장: 일급 함수

## 복습 시간

함수가 "일급(First-class)"이라는 말은 다른 일반적인 값들과 똑같이 취급할 수 있다는 것을 의미합니다. 함수를 특별하게 대우하지 않고 일반 데이터 타입처럼 다룰 수 있다는 뜻이죠. 예를 들어 배열에 저장하거나, 다른 함수의 인자로 전달하거나, 변수에 할당하는 등 값으로 할 수 있는 모든 것을 함수로도 할 수 있습니다.

지금부터 볼 내용은 아주 기초적인 자바스크립트 개념이지만, 깃허브 오픈소스에서도 이 원칙을 놓치는 코드를 흔히 볼 수 있으므로 짚고 넘어가겠습니다. 간단한 예시를 볼까요?

```js
const hi = (name) => `Hi ${name}`;
const greeting = (name) => hi(name);
```

여기서 `hi`를 감싸는 `greeting` 함수는 사실상 아무런 일도 하지 않습니다. 왜일까요? 자바스크립트에서 함수는 **호출 가능(callable)**하기 때문입니다. `hi` 뒤에 `()`가 붙으면 `hi`는 실행되어 값을 반환합니다. 괄호가 없을 때는 그저 변수에 담긴 함수 자체를 참조할 뿐입니다.

```js
hi; // name => `Hi ${name}`
hi("jonas"); // "Hi jonas"
```

`greeting`은 그저 `hi`를 자신과 똑같은 인자로 호출할 뿐이므로 훨씬 더 단순하게 쓸 수 있습니다:

```js
const greeting = hi;
greeting("times"); // "Hi times"
```

다시 말해, `hi`가 이미 단일 인자를 받는 함수인데 왜 굳이 똑같은 인자로 `hi`를 단순히 호출하기만 하는 함수로 감싸야 할까요? 전혀 쓸모가 없습니다. 이는 마치 찌는 듯이 더운 7월 한여름에 두꺼운 패딩을 껴입고 덥다고 불평하는 것과 같습니다.

함수를 불필요하게 다른 함수로 감싸는 것은 단순히 실행을 느리게 만들 뿐만 아니라 코드를 장황하게 만듭니다(잠시 후에 살펴보겠지만 유지보수 측면에서도 큰 문제가 됩니다).

더 나아가기 전에 이 원리를 확실히 다지기 위해 npm 패키지들에서 흔히 볼 수 있는 예시를 살펴보겠습니다.

```js
// 무식한 방법
const getServerStuff = (callback) => ajaxCall((json) => callback(json));

// 똑똑한 방법
const getServerStuff = ajaxCall;
```

세상은 이처럼 불필요한 래퍼 함수들로 가득 차 있습니다. 위의 두 코드가 왜 같은지 단계별로 설명해 보겠습니다:

```js
// 이 표현식은
ajaxCall((json) => callback(json));

// 아래와 완전히 같습니다.
ajaxCall(callback);

// 따라서 getServerStuff를 다음과 같이 개선할 수 있고,
const getServerStuff = (callback) => ajaxCall(callback);

// 이는 다시 아래 코드와 완전히 같습니다.
const getServerStuff = ajaxCall; // 보시다시피 불필요한 ()와 래퍼가 사라졌습니다.
```

이것이 바로 제대로 된 코드입니다. 왜 제가 이렇게 강조하는지 이해할 수 있도록 또 다른 예시를 들어보겠습니다:

```js
const BlogController = {
  index(posts) {
    return Views.index(posts);
  },
  show(post) {
    return Views.show(post);
  },
  create(attrs) {
    return Db.create(attrs);
  },
  update(post, attrs) {
    return Db.update(post, attrs);
  },
  destroy(post) {
    return Db.destroy(post);
  },
};
```

이 무의미한 컨트롤러는 99% 아무 일도 하지 않고 단순히 호출만 넘겨주고 있습니다. 다음과 같이 깔끔하게 고쳐 쓸 수 있습니다:

```js
const BlogController = {
  index: Views.index,
  show: Views.show,
  create: Db.create,
  update: Db.update,
  destroy: Db.destroy,
};
```

## 일급 함수의 장점

좋습니다, 이제 일급 함수의 장점을 살펴봅시다. `getServerStuff`와 `BlogController` 예제에서 보았듯이, 아무 일도 하지 않는 무의미한 레이어를 추가하면 유지보수해야 할 코드의 양만 늘어납니다.

더군다나 불필요하게 감싸진 내부 함수의 시그니처가 변경되면, 그것을 감싸고 있는 바깥 함수도 일일이 수정해야 합니다:

```js
httpGet("/post/2", (json) => renderPost(json));
```

만약 `httpGet`이 `err`도 함께 전달하도록 수정된다면, 우리는 코드로 돌아가 "접착제" 역할을 하던 래퍼를 전부 수정해야 합니다:

```js
// 애플리케이션의 모든 httpGet 호출부를 찾아 명시적으로 err를 넘겨주도록 수정해야 함
httpGet("/post/2", (json, err) => renderPost(json, err));
```

만약 일급 함수를 이용했다면 수정할 필요가 전혀 없었을 것입니다:

```js
// renderPost는 httpGet 내부에서 전달하는 모든 인자를 그대로 받아 호출됩니다
httpGet("/post/2", renderPost);
```

불필요한 함수를 만드는 것은 또 다른 문제를 낳습니다. 바로 인자의 이름을 짓고 변수를 참조해야 한다는 점입니다. 잘 아시다시피 이름 짓기는 프로그래밍에서 가장 까다로운 일 중 하나입니다. 프로젝트가 오래되고 요구사항이 바뀔수록 잘못되거나 부적절한 이름이 늘어나기 마련입니다.

프로젝트에서 동일한 개념을 서로 다른 여러 이름으로 부르면 혼란이 생기기 쉽습니다. 일반적인 코드 재사용성 문제도 발생합니다:

```js
// 우리 블로그 도메인에 특화되어 있음
const validArticles = (articles) =>
  articles.filter((article) => article !== null && article !== undefined);

// 다른 프로젝트에서도 범용적으로 재사용 가능함
const compact = (xs) => xs.filter((x) => x !== null && x !== undefined);
```

도메인에 특화된 구체적인 이름(`articles`)을 사용하면 코드의 활용 범위를 특정 데이터로 스스로 한정 짓게 됩니다. 이는 똑같은 로직을 프로젝트마다 계속해서 다시 만들게 되는 원인이 됩니다.

마지막으로, 객체지향 코드에서 `this`가 언제든 급소를 찌를 수 있다는 점을 경고하고 싶습니다. `this`를 사용하는 함수를 일급으로 취급하려고 하면 잘못된 추상화로 인해 예상치 못한 버그가 발생합니다:

```js
const fs = require("fs");

// 위험한 코드 (this 바인딩 문제 발생 가능)
fs.readFile("freaky_friday.txt", Db.save);

// 안전한 코드
fs.readFile("freaky_friday.txt", Db.save.bind(Db));
```

함수를 자신에게 `bind`함으로써 `Db`는 본래의 문맥에 온전히 접근할 수 있게 됩니다. 함수형 코드를 작성할 때는 `this`를 쓸 필요가 전혀 없습니다. 다른 라이브러리와 연동할 때만 주변의 레거시 환경을 수용하기 위해 사용할 뿐입니다.

이제 기본기를 갖추었으니 앞으로 나아갈 준비가 되었습니다.

[03 장: 순수 함수와 순수한 기쁨을](ch03-kr.md)
