import { TeachingHoursService } from '../../../src/services/teaching-hours.service';

async function test() {
    console.log("Testing Keremt hours with different durations:");

    const keremt2 = { name: 'KEREMT', dailyDurationHours: 2.0 };
    const keremt2_5 = { name: 'KEREMT', dailyDurationHours: 2.5 };
    const keremt3 = { name: 'KEREMT', dailyDurationHours: 3.0 };

    console.log(`Keremt 2.0h: ${TeachingHoursService.getWeeklyHoursForClass(keremt2)} hours/week (Expected: 12)`);
    console.log(`Keremt 2.5h: ${TeachingHoursService.getWeeklyHoursForClass(keremt2_5)} hours/week (Expected: 15)`);
    console.log(`Keremt 3.0h: ${TeachingHoursService.getWeeklyHoursForClass(keremt3)} hours/week (Expected: 18)`);

    const kedamay = { name: 'KEDAMAY', dailyDurationHours: 2.0 };
    console.log(`Kedamay 2.0h: ${TeachingHoursService.getWeeklyHoursForClass(kedamay)} hours/week (Expected: 4)`);
}

test();
