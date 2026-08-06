import * as XLSX from "xlsx";

function mockCourseImport(data: any[][]) {
    const results = { success: 0, courses: [] as any[] };
    let currentCourse: any = null;

    const rows = data.slice(1);
    for (const row of rows) {
        const name = row[0];
        const topic = row[2];

        if (name) {
            if (currentCourse) results.courses.push(currentCourse);
            currentCourse = {
                name,
                topics: topic ? [topic] : [],
                credits: row[3]
            };
        } else if (currentCourse && topic) {
            currentCourse.topics.push(topic);
        }
    }
    if (currentCourse) results.courses.push(currentCourse);
    return results;
}

const mockExcelData = [
    ["Name", "Desc", "Topic", "Credits"],
    ["Math 101", "Basic Math", "Algebra", 3],
    ["", "", "Geometry", ""],
    ["", "", "Calculus", ""],
    ["History 101", "World History", "Renaissance", 2],
    ["", "", "Modern Era", ""],
];

const result = mockCourseImport(mockExcelData);
console.log("Mock Result:", JSON.stringify(result, null, 2));

if (result.courses.length === 2 && result.courses[0].topics.length === 3) {
    console.log("Grouping Logic: SUCCESS");
} else {
    console.log("Grouping Logic: FAILED");
}
