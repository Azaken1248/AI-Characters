function filterMessage(message) {
    const regex = /(\*[^*]*\*)|([^*]+)/g;
    let matches = [];
    let match;
    
    while ((match = regex.exec(message)) !== null) {
        if (match[1] === undefined) {
            let cleanText = match[0].replace(/"/g, '');
            if (cleanText.trim()) {
                matches.push(cleanText.trim());
            }
        }
    }
    
    return matches.join(', ');
}

module.exports = {
    filterMessage
};