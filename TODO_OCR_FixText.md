# TODO_OCR_FixText

- [x] Fix upload spinner that keeps rolling after navigation to /documents/[id]
  - Updated `app/upload/page.tsx`
  - Set `loading=false` immediately before `router.push`
  - (Lint not run due to missing eslint-config-next module in environment)

