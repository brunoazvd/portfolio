export default (ext = 'pdf') => {
	const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
	let randomString = '';
	while (randomString.length < 12) {
		randomString += characters.charAt(Math.floor(Math.random() * characters.length));
	}
	return randomString + '.' + ext;
}