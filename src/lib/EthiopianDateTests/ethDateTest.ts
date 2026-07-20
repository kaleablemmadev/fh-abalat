// /src/lib/EthiopianDateTests/ethDateTest.ts
import prisma from "../prisma";
import { dateToEthiopian, formatEthiopianDate } from "../ethiopiancal";

const memberId = "cmrny2df3000404jrxe5nsk5p";

async function fetchMemberCreatedAtEthiopian(memberId: string) {
  const user = await prisma.user.findUnique({
    where: {
      id: memberId,
    },
    select: {
      fullName: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Convert the Gregorian createdAt date to Ethiopian
  const ethDate = dateToEthiopian(user.createdAt);
  
  return {
    memberName: user.fullName,
    gregorianDate: user.createdAt,
    ethiopianDate: ethDate,
    formattedDate: formatEthiopianDate(ethDate),
  };
}

// Example usage
async function test() {
  try {
    const result = await fetchMemberCreatedAtEthiopian(memberId);
    
    console.log('Member:', result.memberName);
    console.log('Gregorian Date:', result.gregorianDate.toLocaleDateString());
    console.log('Ethiopian Date:', result.formattedDate);
    console.log('Ethiopian Date (short):', formatEthiopianDate(result.ethiopianDate, 'short'));
    
    // Example: Get today's Ethiopian date
    console.log('\nToday\'s Ethiopian Date:', formatEthiopianDate(new Date()));
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the test
test()
  .then(() => console.log('Test completed'))
  .catch((error) => console.error('Test failed:', error));

// Export for use in other files
export { fetchMemberCreatedAtEthiopian };