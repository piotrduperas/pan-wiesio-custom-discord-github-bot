const { WEBHOOK_KEY } = process.env
const avatar = 'https://static.goldenline.pl/user_photo/174/user_2215342_55e958_huge.jpg'


const { Webhook, MessageBuilder } = require('discord-webhook-node')
const http = require('http')
const createHandler = require('github-webhook-handler')
const handler = createHandler({ path: '/webhook', secret: 'myhashsecret' })


const hook = new Webhook(WEBHOOK_KEY)
hook.setAvatar(avatar)
hook.setUsername("Pan Wiesio")
hook.send("Pan Wiesio zaczyna obserwację")


const getBuilder = payload => {
	const builder = new MessageBuilder()
		.setColor('#007700')
	return payload
		? builder.setAuthor(payload.sender.login, payload.sender.avatar_url)
		: builder
}


handler.on('*', e => {
	console.log('Received something', e)

	const { event, payload } = e


	if(event == 'create' && payload.ref_type == 'branch'){
		const embed = getBuilder(payload)
			.setTitle('Utworzyłem nową gałąź')
			.setDescription('Nazywa się '+ payload.ref+'.')
		hook.send(embed)
	}

	if(event == 'push' && payload.commits && payload.commits.length){
		const { commits } = payload
		const message = 
			commits.length == 1 ? "Tylko jeden commit" : (
			commits.length < 5 ? `Skromne ${commits.length} commity` 
				: `Aż ${commits.length} commitów!`)

		const embed = getBuilder(payload)
			.setTitle('Push!')
			.setURL(payload.compare)
			.addField(`Na gałęzi ${payload.ref.split("/heads/")[1]}`, message)
		hook.send(embed)
	}

	if(event == 'pull_request' && payload.action == 'opened'){
		const embed = getBuilder(payload)
			.setTitle('Nowy pull request!')
			.setURL(payload.pull_request.html_url)
			.addField(payload.pull_request.title, 'Może przejrzysz? :)')
			.setColor('#00ff00')
		hook.send(embed)
	}

	if(event == 'pull_request' && payload.action == 'closed' && payload.pull_request.merged){
		const embed = getBuilder(payload)
			.setTitle('Zmergowano pull request!')
			.setURL(payload.pull_request.html_url)
			.addField(payload.pull_request.title, 'Zrób pulla :)')
		hook.send(embed)
	}

	if(event == 'pull_request_review' && payload.action == 'submitted'){
		const message = payload.review.state.toLowerCase() == 'approved' ? "Dobra robota :)" : "Coś budzi wątpliwości...";
		const embed = getBuilder(payload)
			.setTitle('Przejrzałem PRa!')
			.setURL(payload.review.html_url)
			.addField(payload.pull_request.title, message)
		hook.send(embed)
	}

	if(event == 'check_suite' && payload.action == 'completed' && payload.check_suite.conclusion == 'failure'){
		const embed = getBuilder()
			.setTitle('Coś wybuchło!')
			.setURL(payload.repository.html_url)
			.addField("Chyba coś się nie buduje...", "Albo testy nie wyszły :)")
			.setColor('#ff0000');
		hook.send(embed)
	}
})


http.createServer((req, res) => {
	handler(req, res, err => {
		res.statusCode = 404
		res.end('no such location')
		console.error(err)
	})
}).listen(7777)