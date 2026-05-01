const STOPWORDS = new Set([
    "the", "a", "an", "in", "on", "at", "to", "for", "of", "and",
    "is", "are", "was", "were", "has", "have", "had", "with", "by",
    "from", "that", "this", "it", "as", "be", "been",
]);

function tokenize(title) {
    const words = title.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
    return new Set(words.filter(w => !STOPWORDS.has(w)));
}

function clusterArticles(articles) {
    const tokens = articles.map(a => tokenize(a.title || ""));
    const parent = Array.from({ length: articles.length }, (_, i) => i);

    function find(x) {
        while (parent[x] !== x) {
            parent[x] = parent[parent[x]];
            x = parent[x];
        }
        return x;
    }

    function union(x, y) {
        parent[find(x)] = find(y);
    }

    for (let i = 0; i < articles.length; i++) {
        for (let j = i + 1; j < articles.length; j++) {
            const intersection = [...tokens[i]].filter(x => tokens[j].has(x));
            if (intersection.length >= 2) {
                union(i, j);
            }
        }
    }

    const clusters = {};
    for (let i = 0; i < articles.length; i++) {
        const root = find(i);
        if (!clusters[root]) clusters[root] = [];
        clusters[root].push(i);
    }

    return Object.values(clusters);
}

function scoreArticles(articles) {
    if (!articles || articles.length === 0) return articles;

    const clusters = clusterArticles(articles);
    const confidenceMap = {};

    clusters.forEach(cluster => {
        const uniqueSources = new Set(cluster.map(i => articles[i].source || ""));
        const srcCount = uniqueSources.size;

        let level = "Low";
        if (srcCount >= 4) level = "High";
        else if (srcCount >= 2) level = "Medium";

        cluster.forEach(i => {
            confidenceMap[i] = level;
        });
    });

    return articles.map((article, i) => ({
        ...article,
        confidence: confidenceMap[i] || "Low"
    }));
}

module.exports = { scoreArticles };
