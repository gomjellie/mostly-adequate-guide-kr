# 06 장: 예제 애플리케이션

## 선언적 코딩

우리는 이제 사고방식을 바꿀 것입니다. 지금부터는 컴퓨터에게 일하는 방법을 하나하나 지시하는 것을 멈추고, 대신 우리가 결과로서 원하는 것이 무엇인지 명세를 작성할 것입니다. 모든 것을 사사건건 통제(마이크로매니징)하려 애쓰는 것보다 스트레스가 훨씬 덜하다는 것을 알게 될 것입니다.

명령형(imperative)과 대비되는 **선언적(declarative)** 코딩이란, 단계별 지시사항을 작성하는 대신 표현식(expression)을 작성한다는 뜻입니다.

SQL을 떠올려 보세요. "먼저 이것을 하고, 그다음에 저것을 하라"는 식이 아닙니다. 데이터베이스로부터 원하는 것을 명시하는 단 하나의 표현식만 존재합니다. 우리가 작업을 수행하는 방법을 결정하지 않고 데이터베이스가 알아서 처리합니다. 데이터베이스가 업그레이드되고 SQL 엔진이 최적화되어도 우리는 쿼리를 변경할 필요가 없습니다. 우리의 명세를 해석하여 동일한 결과를 얻는 방법은 여러 가지가 있기 때문입니다.

저를 포함하여 많은 사람에게 선언적 코딩의 개념은 처음에 쉽게 와닿지 않을 수 있으므로, 감을 잡을 수 있도록 몇 가지 예를 살펴보겠습니다.

```js
// 명령형
const makes = [];
for (let i = 0; i < cars.length; i += 1) {
  makes.push(cars[i].make);
}

// 선언적
const makes = cars.map(car => car.make);
```

명령형 루프는 먼저 배열을 인스턴스화해야 합니다. 인터프리터는 다음으로 넘어가기 전에 이 문장을 평가해야 합니다. 그런 다음 자동차 목록을 직접 순회하며, 수동으로 카운터를 증가시키고 그 세부 구현을 노골적으로 드러냅니다.

반면 `map` 버전은 단 하나의 표현식입니다. 특정한 평가 순서를 요구하지 않습니다. `map` 함수가 어떻게 순회하고 반환된 배열이 어떻게 조립되는지에 대한 많은 자유도가 있습니다. *어떻게(how)*가 아니라 *무엇을(what)* 원하는지 명시합니다. 따라서 반짝이는 선언적 완장을 차게 됩니다.

더 명확하고 간결할 뿐만 아니라, `map` 함수는 내부적으로 얼마든지 최적화될 수 있으며 우리의 소중한 애플리케이션 코드는 변경될 필요가 없습니다.

"하지만 명령형 루프가 훨씬 빠르잖아요"라고 생각하시는 분이 있다면, JIT가 코드를 어떻게 최적화하는지 살펴보시길 권합니다. 이해를 도와줄 [훌륭한 영상](https://www.youtube.com/watch?v=g0ek4vV7nEA)이 있습니다.

또 다른 예를 살펴봅시다.

```js
// 명령형
const authenticate = (form) => {
  const user = toUser(form);
  return logIn(user);
};

// 선언적
const authenticate = compose(logIn, toUser);
```

명령형 버전에 치명적인 문제가 있는 것은 아니지만, 여전히 단계별 평가가 코드에 고정되어 있습니다. 반면 `compose` 표현식은 단순히 하나의 사실을 명시합니다: "인증이란 `toUser`와 `logIn`의 합성이다." 이 역시 지원 라이브러리가 변경될 수 있는 유연성을 제공하며 우리 애플리케이션 코드를 고수준의 명세로 유지시켜 줍니다.

위의 예제에서는 평가 순서가 명시되어 있지만(`toUser`가 `logIn`보다 먼저 호출되어야 함), 순서가 중요하지 않은 시나리오도 많으며 선언적 코딩에서는 이를 쉽게 지정할 수 있습니다(이에 대해서는 나중에 더 다룹니다).

평가 순서를 코드에 고정할 필요가 없기 때문에 선언적 코딩은 병렬 컴퓨팅에 매우 적합합니다. 순수 함수와 결합된 함수형 프로그래밍(FP)이 병렬화의 미래를 위한 훌륭한 선택인 이유가 바로 여기에 있습니다. 병렬/동시성 시스템을 구현하기 위해 특별히 복잡한 일을 할 필요가 없기 때문입니다.

## 함수형 프로그래밍으로 만든 Flickr

이제 선언적이고 합성 가능한 방식으로 예제 애플리케이션을 구축해 보겠습니다. 지금은 약간의 편법을 써서 부수효과를 사용할 것이지만, 이를 최소화하고 순수한 코드베이스와 엄격히 분리할 것입니다. 우리는 Flickr 이미지를 가져와 화면에 표시하는 브라우저 위젯을 만들 것입니다. 앱의 뼈대부터 만들어 봅시다. HTML은 다음과 같습니다:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Flickr App</title>
  </head>
  <body>
    <main id="js-main" class="main"></main>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/require.js/2.2.0/require.min.js"></script>
    <script src="main.js"></script>
  </body>
</html>
```

그리고 main.js 골격입니다:

```js
const CDN = s => `https://cdnjs.cloudflare.com/ajax/libs/${s}`;
const ramda = CDN('ramda/0.21.0/ramda.min');
const jquery = CDN('jquery/3.0.0-rc1/jquery.min');

requirejs.config({ paths: { ramda, jquery } });
requirejs(['jquery', 'ramda'], ($, { compose, curry, map, prop }) => {
  // 여기에 앱 코드가 들어갑니다
});
```

우리는 lodash 대신 `compose`, `curry` 등이 포함된 [ramda](https://ramdajs.com)를 가져옵니다. 과해 보일 수도 있지만 일관성을 위해 책 전반에서 사용할 requirejs를 사용했습니다.

준비가 끝났으니 명세를 살펴봅시다. 우리 앱은 네 가지 작업을 수행합니다.

1. 특정 검색어에 대한 URL 구성하기
2. Flickr API 호출하기
3. 반환된 JSON을 HTML 이미지 태그로 변환하기
4. 화면에 배치하기

위의 작업 중 2개의 비순수(impure) 동작이 있습니다. 보이시나요? 바로 Flickr API에서 데이터를 가져오는 것과 이를 화면에 배치하는 작업입니다. 격리할 수 있도록 이 비순수 동작들을 먼저 정의해 봅시다. 또한 쉬운 디버깅을 위해 유용한 `trace` 함수도 추가하겠습니다.

```js
const Impure = {
  getJSON: curry((callback, url) => $.getJSON(url, callback)),
  setHtml: curry((sel, html) => $(sel).html(html)),
  trace: curry((tag, x) => { console.log(tag, x); return x; }),
};
```

여기서는 jQuery의 메서드를 커링하고 인자 순서를 사용하기 편한 위치로 바꿨을 뿐입니다. 위험한 함수라는 것을 알 수 있도록 `Impure` 네임스페이스로 묶었습니다. 향후 예제에서는 이 두 함수도 순수하게 만들 것입니다.

다음으로 `Impure.getJSON` 함수에 전달할 URL을 구성해야 합니다.

```js
const host = 'api.flickr.com';
const path = '/services/feeds/photos_public.gne';
const query = t => `?tags=${t}&format=json&jsoncallback=?`;
const url = t => `https://${host}${path}${query(t)}`;
```

모노이드(나중에 배울 것입니다)나 컴비네이터를 사용하여 `url`을 포인트프리로 작성하는 화려하고 복잡한 방법도 있습니다. 하지만 우리는 가독성 높은 버전을 선택하여 일반적인 포인트풀 방식으로 이 문자열을 조립했습니다.

API를 호출하고 화면에 콘텐츠를 배치하는 앱 함수를 작성해 봅시다.

```js
const app = compose(Impure.getJSON(Impure.trace('response')), url);
app('cats');
```

이 코드는 `url` 함수를 호출한 다음, `trace`로 부분 적용된 `getJSON` 함수에 문자열을 전달합니다. 앱을 로드하면 콘솔에 API 호출 결과가 출력됩니다.

<img src="images/console_ss.png" alt="console response" />

이 JSON에서 이미지를 구성하고 싶습니다. `mediaUrls`는 `items` 내부의 각 `media` 객체의 `m` 속성에 묻혀 있는 것 같습니다.

이 중첩된 속성에 접근하기 위해 ramda의 유용한 범용 getter 함수인 `prop`을 사용할 수 있습니다. 어떻게 동작하는지 볼 수 있도록 직접 만든 버전을 소개합니다:

```js
const prop = curry((property, object) => object[property]);
```

사실 꽤 단순합니다. 임의의 객체 속성에 접근하기 위해 `[]` 문법을 사용할 뿐입니다. 이것을 사용하여 `mediaUrls`를 가져와 봅시다.

```js
const mediaUrl = compose(prop('m'), prop('media'));
const mediaUrls = compose(map(mediaUrl), prop('items'));
```

`items`를 모은 다음에는 각 미디어 URL을 추출하기 위해 `map`을 적용해야 합니다. 그러면 깔끔한 `mediaUrls` 배열이 얻어집니다. 이를 앱에 연결하고 화면에 출력해 봅시다.

```js
const render = compose(Impure.setHtml('#js-main'), mediaUrls);
const app = compose(Impure.getJSON(render), url);
```

우리가 한 일은 `mediaUrls`를 호출하고 그 결과로 `<main>`의 HTML을 설정하는 새로운 합성을 만든 것뿐입니다. 순수 JSON 외에 렌더링할 대상이 생겼으므로 `trace` 호출을 `render`로 교체했습니다. 이렇게 하면 본문에 미디어 URL 문자열이 거칠게 표시됩니다.

마지막 단계는 이 `mediaUrls`를 온전한 `image` 요소로 변환하는 것입니다. 더 큰 애플리케이션이라면 Handlebars나 React 같은 템플릿/DOM 라이브러리를 사용하겠지만, 이 애플리케이션에서는 img 태그만 필요하므로 jQuery를 그대로 사용합시다.

```js
const img = src => $('<img />', { src });
```

jQuery의 `html` 메서드는 태그 배열을 받을 수 있습니다. 우리는 mediaUrls를 이미지로 변환하여 `setHtml`로 보내주기만 하면 됩니다.

```js
const images = compose(map(img), mediaUrls);
const render = compose(Impure.setHtml('#js-main'), images);
const app = compose(Impure.getJSON(render), url);
```

완성되었습니다!

<img src="images/cats_ss.png" alt="cats grid" />

완성된 스크립트는 다음과 같습니다:
[include](./exercises/ch06/main.js)

얼마나 멋진가요? 어떻게 만들어지는지가 아니라 사물이 무엇인지에 대한 아름다운 선언적 명세입니다. 우리는 이제 각 줄을 성립하는 성질을 가진 방정식으로 바라봅니다. 이러한 성질을 사용하여 애플리케이션을 추론하고 리팩토링할 수 있습니다.

## 원칙에 기반한 리팩토링

여기서 최적화할 수 있는 부분이 있습니다. 각 항목을 미디어 URL로 변환하기 위해 `map`을 수행한 다음, 다시 그 mediaUrls를 img 태그로 변환하기 위해 `map`을 수행합니다. `map`과 합성에는 다음과 같은 법칙이 있습니다:

```js
// map의 합성 법칙
compose(map(f), map(g)) === map(compose(f, g));
```

이 성질을 사용하여 코드를 최적화할 수 있습니다. 원칙에 기반한 리팩토링을 진행해 봅시다.

```js
// 기존 코드
const mediaUrl = compose(prop('m'), prop('media'));
const mediaUrls = compose(map(mediaUrl), prop('items'));
const images = compose(map(img), mediaUrls);
```

`map`들을 나란히 정렬해 봅시다. 방정식적 추론(equational reasoning)과 순수성 덕분에 `images`에서 `mediaUrls` 호출을 인라인화할 수 있습니다.

```js
const mediaUrl = compose(prop('m'), prop('media'));
const images = compose(map(img), map(mediaUrl), prop('items'));
```

이제 `map`들이 나란히 정렬되었으므로 합성 법칙을 적용할 수 있습니다.

```js
/*
compose(map(f), map(g)) === map(compose(f, g));
compose(map(img), map(mediaUrl)) === map(compose(img, mediaUrl));
*/

const mediaUrl = compose(prop('m'), prop('media'));
const images = compose(map(compose(img, mediaUrl)), prop('items'));
```

이제 각 항목을 img로 변환하는 동안 단 한 번만 순회하게 됩니다. 함수를 별도로 추출하여 가독성을 조금 더 높여 봅시다.

```js
const mediaUrl = compose(prop('m'), prop('media'));
const mediaToImg = compose(img, mediaUrl);
const images = compose(map(mediaToImg), prop('items'));
```

## 요약

우리는 새롭게 배운 기술을 작지만 실용적인 앱에 적용하는 방법을 살펴보았습니다. 수학적 프레임워크를 사용하여 코드를 추론하고 리팩토링했습니다. 하지만 에러 처리와 조건부 분기는 어떻게 다루어야 할까요? 파괴적인 함수를 네임스페이스로 묶는 것에 그치지 않고 전체 애플리케이션을 순수하게 만들려면 어떻게 해야 할까요? 앱을 더욱 안전하고 표현력 있게 만들려면 어떻게 해야 할까요? 이것이 바로 우리가 2부에서 다룰 질문들입니다.

[07 장: 힌들리-밀너와 나](ch07-kr.md)
