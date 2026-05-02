# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\e2e.spec.ts >> Upload Flow >> 完整上传流程：选择图片→裁剪→填写类型→填写备注→保存→列表显示
- Location: tests\e2e.spec.ts:239:7

# Error details

```
Error: page.evaluate: SecurityError: Failed to execute 'deleteDatabase' on 'IDBFactory': access to the Indexed Database API is denied in this context.
    at eval (eval at evaluate (:302:30), <anonymous>:3:31)
    at new Promise (<anonymous>)
    at eval (eval at evaluate (:302:30), <anonymous>:2:14)
    at UtilityScript.evaluate (<anonymous>:304:16)
    at UtilityScript.<anonymous> (<anonymous>:1:44)
```