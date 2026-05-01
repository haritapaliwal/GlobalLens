const { fetchNews } = require('./services/newsService');

fetchNews('China', 'CN', 'student', {}, '')
  .then(articles => {
      console.log('Fetched articles:', articles.length);
      console.log(articles.slice(0, 2));
  })
  .catch(console.error);
