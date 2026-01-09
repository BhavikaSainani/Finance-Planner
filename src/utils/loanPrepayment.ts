/**
 * Loan Prepayment Impact Simulator
 * 
 * Calculates the impact of prepayment on loan tenure and interest savings.
 * Uses standard loan amortization mathematics.
 */

export interface LoanPrepaymentInput {
  loanPrincipal: number;
  annualInterestRate: number;
  loanTenureMonths: number;
  monthlyEMI: number;
  outstandingPrincipal: number;
  prepaymentAmount: number;
  prepaymentMonth: number;
}

export interface LoanPrepaymentResult {
  interest_before_prepayment: number;
  interest_after_prepayment: number;
  interest_saved: number;
  original_tenure_months: number;
  new_tenure_months: number;
  tenure_reduction_months: number;
  summary: string;
}

/**
 * Calculate total interest payable without prepayment
 */
function calculateInterestWithoutPrepayment(
  principal: number,
  monthlyRate: number,
  tenureMonths: number,
  emi: number
): number {
  const totalAmountPaid = emi * tenureMonths;
  return totalAmountPaid - principal;
}

/**
 * Calculate remaining tenure after prepayment
 * Uses Newton-Raphson method to solve for tenure when EMI is constant
 */
function calculateNewTenure(
  principal: number,
  monthlyRate: number,
  emi: number
): number {
  if (monthlyRate === 0) {
    // If interest rate is 0, simple division
    return Math.ceil(principal / emi);
  }

  // Using the formula: EMI = P * r * (1+r)^n / ((1+r)^n - 1)
  // Solving for n: n = log(1 + (P*r/EMI)) / log(1+r)
  // But we need to account for the fact that principal reduces over time
  
  // More accurate: Use iterative approach to find tenure
  let remainingPrincipal = principal;
  let months = 0;
  const maxMonths = 600; // 50 years max
  
  while (remainingPrincipal > 0.01 && months < maxMonths) {
    const interestComponent = remainingPrincipal * monthlyRate;
    const principalComponent = emi - interestComponent;
    
    if (principalComponent <= 0) {
      // EMI is too small to cover interest
      return maxMonths;
    }
    
    remainingPrincipal -= principalComponent;
    months++;
  }
  
  return Math.ceil(months);
}

/**
 * Simulate loan repayment with prepayment
 * Assumes we're calculating from the start of the loan
 */
function simulateLoanWithPrepayment(
  originalPrincipal: number,
  outstandingPrincipal: number,
  monthlyRate: number,
  emi: number,
  prepaymentAmount: number,
  prepaymentMonth: number,
  originalTenureMonths: number
): {
  newTenureMonths: number;
  totalInterestPaid: number;
} {
  let remainingPrincipal = originalPrincipal;
  let totalInterestPaid = 0;
  let monthsElapsed = 0;
  
  // Simulate loan repayment month by month
  for (let month = 1; month <= originalTenureMonths; month++) {
    if (remainingPrincipal <= 0.01) {
      break;
    }
    
    const interestComponent = remainingPrincipal * monthlyRate;
    let principalComponent = emi - interestComponent;
    
    // Ensure principal component doesn't exceed remaining principal
    if (principalComponent > remainingPrincipal) {
      principalComponent = remainingPrincipal;
    }
    
    totalInterestPaid += interestComponent;
    remainingPrincipal -= principalComponent;
    monthsElapsed++;
    
    // Apply prepayment at the specified month
    if (month === prepaymentMonth && remainingPrincipal > 0) {
      const prepaymentToApply = Math.min(prepaymentAmount, remainingPrincipal);
      remainingPrincipal -= prepaymentToApply;
      
      // If prepayment fully pays off the loan, break
      if (remainingPrincipal <= 0.01) {
        break;
      }
    }
  }
  
  // If loan is not fully paid, calculate remaining tenure
  if (remainingPrincipal > 0.01) {
    // Calculate how many more months needed with same EMI
    let tempPrincipal = remainingPrincipal;
    let additionalMonths = 0;
    const maxAdditionalMonths = 600;
    
    while (tempPrincipal > 0.01 && additionalMonths < maxAdditionalMonths) {
      const interestComponent = tempPrincipal * monthlyRate;
      const principalComponent = emi - interestComponent;
      
      if (principalComponent <= 0) {
        // EMI too small, cannot pay off
        additionalMonths = maxAdditionalMonths;
        break;
      }
      
      totalInterestPaid += interestComponent;
      tempPrincipal -= principalComponent;
      additionalMonths++;
    }
    
    return {
      newTenureMonths: monthsElapsed + additionalMonths,
      totalInterestPaid: Math.round(totalInterestPaid * 100) / 100
    };
  }
  
  return {
    newTenureMonths: monthsElapsed,
    totalInterestPaid: Math.round(totalInterestPaid * 100) / 100
  };
}

/**
 * Main function to calculate loan prepayment impact
 */
export function calculateLoanPrepaymentImpact(
  input: LoanPrepaymentInput
): LoanPrepaymentResult {
  const {
    loanPrincipal,
    annualInterestRate,
    loanTenureMonths,
    monthlyEMI,
    outstandingPrincipal,
    prepaymentAmount,
    prepaymentMonth,
  } = input;

  // Validate inputs
  if (
    loanPrincipal <= 0 ||
    annualInterestRate < 0 ||
    loanTenureMonths <= 0 ||
    monthlyEMI <= 0 ||
    outstandingPrincipal <= 0 ||
    prepaymentAmount <= 0 ||
    prepaymentMonth <= 0 ||
    prepaymentMonth > loanTenureMonths
  ) {
    throw new Error("Invalid input parameters");
  }

  // Calculate monthly interest rate
  const monthlyRate = annualInterestRate / 12 / 100;

  // Calculate total interest without prepayment
  const interestBeforePrepayment = calculateInterestWithoutPrepayment(
    loanPrincipal,
    monthlyRate,
    loanTenureMonths,
    monthlyEMI
  );

  // Simulate loan with prepayment
  const { newTenureMonths, totalInterestPaid } = simulateLoanWithPrepayment(
    loanPrincipal,
    outstandingPrincipal,
    monthlyRate,
    monthlyEMI,
    prepaymentAmount,
    prepaymentMonth,
    loanTenureMonths
  );

  const interestAfterPrepayment = totalInterestPaid;
  const interestSaved = interestBeforePrepayment - interestAfterPrepayment;
  const tenureReduction = loanTenureMonths - newTenureMonths;

  // Generate summary
  let summary = "";
  if (prepaymentAmount < outstandingPrincipal * 0.01) {
    summary = `Prepayment amount (₹${prepaymentAmount.toLocaleString()}) is very small relative to outstanding principal (₹${outstandingPrincipal.toLocaleString()}). The impact may be minimal. `;
  }
  
  summary += `By prepaying ₹${prepaymentAmount.toLocaleString()} in month ${prepaymentMonth}, you will save ₹${Math.round(interestSaved).toLocaleString()} in interest and reduce your loan tenure by ${tenureReduction} months (from ${loanTenureMonths} months to ${newTenureMonths} months).`;

  return {
    interest_before_prepayment: Math.round(interestBeforePrepayment * 100) / 100,
    interest_after_prepayment: Math.round(interestAfterPrepayment * 100) / 100,
    interest_saved: Math.round(interestSaved * 100) / 100,
    original_tenure_months: loanTenureMonths,
    new_tenure_months: newTenureMonths,
    tenure_reduction_months: Math.max(0, tenureReduction),
    summary,
  };
}

/**
 * Service function that returns JSON output
 * This is the main entry point for the simulator
 */
export function simulateLoanPrepayment(input: LoanPrepaymentInput): string {
  try {
    const result = calculateLoanPrepaymentImpact(input);
    return JSON.stringify(result, null, 2);
  } catch (error) {
    return JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}
