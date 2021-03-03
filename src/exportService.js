const xlsx = require('xlsx');
const path = require('path');

const exportExcel = (data, workSheetColumnNames, workSheetName, filePath) => {
    const workBook = xlsx.utils.book_new();
    const workSheetData = [
        workSheetColumnNames,
        ... data
    ];

    const workSheet = xlsx.utils.aoa_to_sheet(workSheetData);
    xlsx.utils.book_append_sheet(workBook, workSheet, workSheetName);
    xlsx.writeFile(workBook, path.resolve(filePath));
}

const exportUsersToExcel = (users, workSheetColumnNames, workSheetName, filePath) => {
    const data = users.map(user => {
        return [user.studentId.profile.name ? user.studentId.profile.name : user.studentId.email, user.totalScore, user.createdAt]
    });
    exportExcel(data, workSheetColumnNames, workSheetName, filePath)
}

module.exports = exportUsersToExcel;