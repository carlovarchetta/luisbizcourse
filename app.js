require('dotenv').config()

const logger = require('morgan')
const express = require('express')
const errorHandler = require('errorhandler')
const bodyParser = require('body-parser')
const methodOverride = require('method-override')

const app = express()
const path = require('path')
const port = 3000

app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(methodOverride())
app.use(errorHandler())

const Prismic = require('@prismicio/client')
const PrismicDOM = require('prismic-dom')

const initApi = req => {
  return Prismic.getApi(process.env.PRISMIC_ENDPOINT, {
    accessToken: process.env.PRISMIC_ACCESS_TOKEN,
    req
  })
}

// const initApi = (req) => {
//   return Prismic.client(process.env.PRISMIC_ENDPOINT, {
//     accessToken: process.env.PRISMIC_ACCESS_TOKEN,
//     req
//   })
// }

const handleLinkResolver = doc => {
  // // Define the url depending on the document type
  // if (doc.type === 'page') {
  //   return '/page/' + doc.uid;
  // } else if (doc.type === 'blog_post') {
  //   return '/blog/' + doc.uid;
  // }

  // Default to homepage
  return '/'
}

app.use((req, res, next) => {
  res.locals.Links = handleLinkResolver

  res.locals.Numbers = index => {
    // eslint-disable-next-line eqeqeq
    return index == 0 ? 'One' : index == 1 ? 'Two' : index == 2 ? 'Three' : index == 3 ? 'Four' : ''
  }

  res.locals.PrismicDOM = PrismicDOM

  next()
})

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')

app.get('/', async (req, res) => {
  res.render('pages/home')
})

app.get('/about', async (req, res) => {
  const api = await initApi(req)
  const about = await api.getSingle('about')
  const meta = await api.getSingle('meta')
  const preloader = await api.getSingle('preloader')

  res.render('pages/about', {
    about,
    meta,
    preloader
  })
})

app.get('/collections', async (req, res) => {
  const api = await initApi(req)
  const meta = await api.getSingle('meta')
  const home = await api.getSingle('home')
  const preloader = await api.getSingle('preloader')

  const { results: collections } = await api.query(Prismic.Predicates.at('document.type', 'collection'), {
    fetchLinks: 'product.image'
  })

  res.render('pages/collections', {
    collections,
    home,
    meta,
    preloader
  })
})

app.get('/detail/:uid', async (req, res) => {
  const api = await initApi(req)
  const meta = await api.getSingle('meta')
  const preloader = await api.getSingle('preloader')

  const product = await api.getByUID('product', req.params.uid, {
    fetchLinks: 'collection.title'
  })

  res.render('pages/detail', {
    meta,
    product,
    preloader
  })
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
