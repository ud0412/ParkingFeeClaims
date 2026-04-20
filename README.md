<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/a9227f9a-b68c-47d1-a90f-68635a06df08

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## 시스템 설명

주차비 청구 시스템 입니다.

Google AI Studio 에서 바이브 코딩으로 만들었습니다.


주차 영수증 사진을 등록하면 google ai 가 OCR 을 통해 정보를 획득하고 이를 이용하여 청구서를 자동 생성해 줍니다.

사용자는 user, manager, admin 의 role 을 가지며 

admin 은 사용자의 role 을 변경하고 사용자를 삭제하고, 사용자 비밀 번호를 초기화 할 수 있습니다.

manager 는 주차비 청구가 가능한 주차장과 1회 최대 청구 금액을 설정하고 청구된 기간을 설정하여 청구서 내역을 보고 CSV 로 다운로드 받을 수 있습니다.

user 는 주차비를 청구하고 지금까지 청구한 리스트를 확인 할 수 있습니다.


admin 은 사용자 이름을 admin, Admin, ADMIN 중 하나로 사용자를 생성하면 admin role 을 가지게 됩니다.

이후 사용자 role 은 admin 이 변경하여야 합니다.

한국어, 영어, 중국어, 베트남어, 스페인어의 다국어를 지원 합니다.
