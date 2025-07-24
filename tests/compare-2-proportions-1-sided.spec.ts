import { test, expect } from '@playwright/test';

test.describe('Calculator: Compare 2 Proportions (1-Sided)', () => {
  test('should calculate the correct sample size and power', async ({ page }) => {
    // 1. 페이지로 이동합니다.
    await page.goto('/calculator/compare-2-proportions/1-sided');

    // 2. 페이지 제목을 확인합니다.
    await expect(page).toHaveTitle(/Open PowerSampleSize/);

    // 3. Solve for Sample Size
    // 3-1. 입력 필드에 값을 입력합니다.
    await page.getByTestId('power').fill('0.8');
    await page.getByTestId('alpha').fill('0.05');
    await page.getByTestId('pA').fill('0.65');
    await page.getByTestId('pB').fill('0.85');
    await page.getByTestId('kappa').fill('1');

    // 3-2. 'Calculate' 버튼을 클릭합니다.
    await page.getByRole('button', { name: 'Calculate' }).click();

    // 3-3. 계산된 표본 크기(B)가 올바른지 확인합니다.
    const sampleSizeInput = page.getByTestId('sampleSize');
    await expect(sampleSizeInput).toHaveValue('55');

    // 4. Solve for Power
    // 4-1. 'Solve for'를 'Power'로 변경하고 값을 입력합니다.
    await page.getByRole('radiogroup').getByText('Power', { exact: true }).click();
    await page.getByTestId('sampleSize').fill('55');

    // 4-2. 'Calculate' 버튼을 클릭합니다.
    await page.getByRole('button', { name: 'Calculate' }).click();

    // 4-3. 계산된 Power가 0.8에 가까운지 확인합니다.
    const powerInput = page.getByTestId('power');
    const powerValueString = await powerInput.inputValue();
    const powerValue = parseFloat(powerValueString);
    await expect(powerValue).toBeCloseTo(0.8, 1);
  });
});
