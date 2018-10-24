// -*- Javascript -*-

// To make emoji work, see
// http://stackoverflow.com/questions/35142493/how-can-i-write-emoji-characters-to-a-textarea
function findSurrogatePair(point) {
    var offset = point - 0x10000,
    lead = 0xd800 + (offset >> 10),
    trail = 0xdc00 + (offset & 0x3ff);
    return String.fromCharCode(lead) + String.fromCharCode(trail);
}

// reverse a string of hex encodings
// "deadbeef" -> "efbeadde"
function reverseHex(hex) {
    let str = '';
    for (var i = -2; i >= -hex.length; i -= 2) {
        str += hex.substr(i, 2);
    }
    return str;
}


export { findSurrogatePair, reverseHex }
