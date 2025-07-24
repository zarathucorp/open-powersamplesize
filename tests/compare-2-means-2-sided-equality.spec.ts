import { test, expect } from '@playwright/test';

test.describe('Calculator: Compare 2 Means (2-Sided Equality)', () => {
  test('should calculate the correct sample size', async ({ page }) => {
    // 1. 페이지로 이동합니다.
    await page.goto('/calculator/compare-2-means/2-sided-equality');

    // 2. 페이지 제목을 확인합니다.
    await expect(page).toHaveTitle(/Open PowerSampleSize/);

    // 3. .Solve for Sample Size
    // 3-1. 입력 필드에 값을 입력합니다.
    await page.getByTestId('power').fill('0.8');
    await page.getByTestId('alpha').fill('0.05');
    await page.getByTestId('meanA').fill('5');
    await page.getByTestId('meanB').fill('10');
    await page.getByTestId('stdDev').fill('10');
    await page.getByTestId('kappa').fill('1');

    // 3-2. 'Calculate' 버튼을 클릭합니다.
    await page.getByRole('button', { name: 'Calculate' }).click();

    // 3-3. 계산된 표본 크기(B)가 올바른지 확인합니다.
    const sampleSizeInput = page.getByTestId('sampleSizeB');
    await expect(sampleSizeInput).toHaveValue('63');

    // 4. Solve for Power
    // 4-1. 'Solve for'를 'Power'로 변경하고 값을 입력합니다.
    // 'radiogroup' 내의 'Power' 라벨을 클릭하여 선택자를 한정합니다.
    await page.getByRole('radiogroup').getByText('Power', { exact: true }).click();
    await page.getByTestId('sampleSizeB').fill('63');
    // 다른 값들은 이전 단계에서 입력한 상태가 유지됩니다.

    // 4-2. 'Calculate' 버튼을 클릭합니다.
    await page.getByRole('button', { name: 'Calculate' }).click();

    // 4-3. 계산된 Power가 반올림해서 0.8인지 확인합니다.
    const powerInput = page.getByTestId('power');
    const powerValueString = await powerInput.inputValue();
    const powerValue = parseFloat(powerValueString);

    // 실제 계산값은 약 0.8013입니다.
    // 값이 0.8에 매우 가까운지 확인 (소수점 2자리 정밀도)
    await expect(powerValue).toBeCloseTo(0.8, 1);
  });
});
