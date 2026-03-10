// Mock data for frontend development without backend
// Uses real TMDB image URLs so the UI looks realistic

const TMDB_IMG = 'https://image.tmdb.org/t/p'

export const mockGenres = [
  { id: 1, name: 'Acción', slug: 'accion', tmdb_id: 28, media_count: 45 },
  { id: 2, name: 'Aventura', slug: 'aventura', tmdb_id: 12, media_count: 32 },
  { id: 3, name: 'Comedia', slug: 'comedia', tmdb_id: 35, media_count: 28 },
  { id: 4, name: 'Drama', slug: 'drama', tmdb_id: 18, media_count: 52 },
  { id: 5, name: 'Ciencia Ficción', slug: 'ciencia-ficcion', tmdb_id: 878, media_count: 25 },
  { id: 6, name: 'Terror', slug: 'terror', tmdb_id: 27, media_count: 18 },
  { id: 7, name: 'Animación', slug: 'animacion', tmdb_id: 16, media_count: 35 },
  { id: 8, name: 'Thriller', slug: 'thriller', tmdb_id: 53, media_count: 22 },
  { id: 9, name: 'Romance', slug: 'romance', tmdb_id: 10749, media_count: 15 },
  { id: 10, name: 'Fantasía', slug: 'fantasia', tmdb_id: 14, media_count: 20 },
  { id: 11, name: 'Documental', slug: 'documental', tmdb_id: 99, media_count: 12 },
  { id: 12, name: 'Crimen', slug: 'crimen', tmdb_id: 80, media_count: 19 },
  { id: 13, name: 'Misterio', slug: 'misterio', tmdb_id: 9648, media_count: 14 },
  { id: 14, name: 'Guerra', slug: 'guerra', tmdb_id: 10752, media_count: 8 },
  { id: 15, name: 'Shonen', slug: 'shonen', tmdb_id: null, media_count: 15 },
  { id: 16, name: 'Seinen', slug: 'seinen', tmdb_id: null, media_count: 10 },
]

export const mockActors = [
  { id: 1, name: 'Tom Hanks', tmdb_id: 31, photo_path: `${TMDB_IMG}/w185/xndWFsBlClOJFRdhSt4NBwiPq2o.jpg`, popularity: 85.5, media_count: 8 },
  { id: 2, name: 'Scarlett Johansson', tmdb_id: 1245, photo_path: `${TMDB_IMG}/w185/6NsMbJXRlDZuDzatN2akFY8wHKn.jpg`, popularity: 92.3, media_count: 6 },
  { id: 3, name: 'Leonardo DiCaprio', tmdb_id: 6193, photo_path: `${TMDB_IMG}/w185/wo2hJpn04vbtmh0B9utCFGqo1kD.jpg`, popularity: 95.1, media_count: 7 },
  { id: 4, name: 'Margot Robbie', tmdb_id: 234352, photo_path: `${TMDB_IMG}/w185/euDPyqLnuwaWMHsnp9A7jSIxQga.jpg`, popularity: 88.7, media_count: 5 },
  { id: 5, name: 'Robert Downey Jr.', tmdb_id: 3223, photo_path: `${TMDB_IMG}/w185/im9SAqJPMBEG6KAnavPAypEF0bT.jpg`, popularity: 91.2, media_count: 9 },
  { id: 6, name: 'Cillian Murphy', tmdb_id: 2037, photo_path: `${TMDB_IMG}/w185/dm6V24NjjvjMiCtbMkc8Y2WPm2e.jpg`, popularity: 78.4, media_count: 4 },
  { id: 7, name: 'Ana de Armas', tmdb_id: 224513, photo_path: `${TMDB_IMG}/w185/3vGgxGKBwKDzILoIfkhqAMiTsCj.jpg`, popularity: 82.1, media_count: 3 },
  { id: 8, name: 'Pedro Pascal', tmdb_id: 1253360, photo_path: `${TMDB_IMG}/w185/9VAfSEVkHeiMI2lMjGAqdRwDmme.jpg`, popularity: 89.6, media_count: 5 },
  { id: 9, name: 'Florence Pugh', tmdb_id: 1373737, photo_path: `${TMDB_IMG}/w185/6bBNjd3M4urNKMWXEO0jBkXJhMq.jpg`, popularity: 76.3, media_count: 4 },
  { id: 10, name: 'Timothée Chalamet', tmdb_id: 1190668, photo_path: `${TMDB_IMG}/w185/BE2sdjpgsa2rNTFa66f7upkaOP.jpg`, popularity: 87.9, media_count: 5 },
  { id: 11, name: 'Zendaya', tmdb_id: 505710, photo_path: `${TMDB_IMG}/w185/tylFbROxRsD1vBMGbS0pmcD4pg8.jpg`, popularity: 90.4, media_count: 4 },
  { id: 12, name: 'Keanu Reeves', tmdb_id: 6384, photo_path: `${TMDB_IMG}/w185/4D0PpNI0hmqTDdrtkfnnGDSXCZC.jpg`, popularity: 83.7, media_count: 6 },
]

const mockMovies = [
  {
    id: 1, title: 'Oppenheimer', original_title: 'Oppenheimer', year: 2023, media_type: 'movie',
    tmdb_id: 872585, overview: 'La historia del científico J. Robert Oppenheimer y su papel en el desarrollo de la bomba atómica.',
    poster_path: `${TMDB_IMG}/w500/5t05uhX5ULn8Um2f1ZuznVvIffU.jpg`,
    backdrop_path: `${TMDB_IMG}/w1280/ycnO0cjsAROSGJKuMODgRtWsHQw.jpg`,
    rating: 8.1, vote_count: 8500, runtime: 180, status: 'completed', processing_progress: 100,
    language: 'en', duration: 10800, width: 1920, height: 1080, codec: 'h264', file_size: 4500000000,
    filename: 'Oppenheimer.2023.1080p.BluRay.x264.mkv', path: '/api/media/1/stream',
    genres: [{ id: 4, name: 'Drama', slug: 'drama' }, { id: 14, name: 'Guerra', slug: 'guerra' }],
    actors: [{ id: 6, name: 'Cillian Murphy', photo_path: `${TMDB_IMG}/w185/dm6V24NjjvjMiCtbMkc8Y2WPm2e.jpg` }],
    directors: [{ id: 1, name: 'Christopher Nolan', photo_path: `${TMDB_IMG}/w185/xuAIuYSmsUzKlUMBFGVZaWsY3DZ.jpg` }],
    created_at: '2024-01-15T10:00:00Z', updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 2, title: 'Dune: Parte Dos', original_title: 'Dune: Part Two', year: 2024, media_type: 'movie',
    tmdb_id: 693134, overview: 'Paul Atreides se une a los Fremen mientras busca venganza contra los conspiradores que destruyeron a su familia.',
    poster_path: `${TMDB_IMG}/w500/xCHmhHeO7aOCMlzcNukGH6Q7EiD.jpg`,
    backdrop_path: `${TMDB_IMG}/w1280/ylkdrn23p3gQcHx7ukIfuy2CkTE.jpg`,
    rating: 8.3, vote_count: 6200, runtime: 166, status: 'completed', processing_progress: 100,
    language: 'en', duration: 9960, filename: 'Dune.Part.Two.2024.1080p.mkv', path: '/api/media/2/stream',
    genres: [{ id: 5, name: 'Ciencia Ficción', slug: 'ciencia-ficcion' }, { id: 2, name: 'Aventura', slug: 'aventura' }],
    actors: [{ id: 10, name: 'Timothée Chalamet', photo_path: `${TMDB_IMG}/w185/BE2sdjpgsa2rNTFa66f7upkaOP.jpg` }],
    created_at: '2024-03-10T10:00:00Z', updated_at: '2024-03-10T10:00:00Z',
  },
  {
    id: 3, title: 'El origen', original_title: 'Inception', year: 2010, media_type: 'movie',
    tmdb_id: 27205, overview: 'Un ladrón que roba secretos corporativos a través del uso de la tecnología de los sueños compartidos.',
    poster_path: `${TMDB_IMG}/w500/tXQvtRWfkUUnWJAn2tN3jERIUG.jpg`,
    backdrop_path: `${TMDB_IMG}/w1280/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg`,
    rating: 8.4, vote_count: 35000, runtime: 148, status: 'completed', processing_progress: 100,
    language: 'en', filename: 'Inception.2010.1080p.mkv', path: '/api/media/3/stream',
    genres: [{ id: 1, name: 'Acción', slug: 'accion' }, { id: 5, name: 'Ciencia Ficción', slug: 'ciencia-ficcion' }],
    actors: [{ id: 3, name: 'Leonardo DiCaprio', photo_path: `${TMDB_IMG}/w185/wo2hJpn04vbtmh0B9utCFGqo1kD.jpg` }],
    created_at: '2024-01-10T10:00:00Z', updated_at: '2024-01-10T10:00:00Z',
  },
  {
    id: 4, title: 'Interstellar', original_title: 'Interstellar', year: 2014, media_type: 'movie',
    tmdb_id: 157336, overview: 'Un grupo de exploradores viaja a través de un agujero de gusano en el espacio para asegurar la supervivencia de la humanidad.',
    poster_path: `${TMDB_IMG}/w500/fbUwSqYIP0isCiJXey3staY3DNn.jpg`,
    backdrop_path: `${TMDB_IMG}/w1280/2ssWTSVklAEc98frZUQhgtGHx7s.jpg`,
    rating: 8.6, vote_count: 33000, runtime: 169, status: 'completed', processing_progress: 100,
    language: 'en', filename: 'Interstellar.2014.1080p.mkv', path: '/api/media/4/stream',
    genres: [{ id: 5, name: 'Ciencia Ficción', slug: 'ciencia-ficcion' }, { id: 4, name: 'Drama', slug: 'drama' }],
    actors: [],
    created_at: '2024-01-05T10:00:00Z', updated_at: '2024-01-05T10:00:00Z',
  },
  {
    id: 5, title: 'Barbie', original_title: 'Barbie', year: 2023, media_type: 'movie',
    tmdb_id: 346698, overview: 'Barbie sufre una crisis existencial y decide abandonar Barbieland para explorar el mundo real.',
    poster_path: `${TMDB_IMG}/w500/fNtqD4BTFj0Bgo9lyoAtmNFzxHN.jpg`,
    backdrop_path: `${TMDB_IMG}/w1280/3N5QNUqS76GFYNoEayfkkJyAyTN.jpg`,
    rating: 7.0, vote_count: 7800, runtime: 114, status: 'completed', processing_progress: 100,
    language: 'en', filename: 'Barbie.2023.1080p.mkv', path: '/api/media/5/stream',
    genres: [{ id: 3, name: 'Comedia', slug: 'comedia' }, { id: 10, name: 'Fantasía', slug: 'fantasia' }],
    actors: [{ id: 4, name: 'Margot Robbie', photo_path: `${TMDB_IMG}/w185/euDPyqLnuwaWMHsnp9A7jSIxQga.jpg` }],
    created_at: '2024-02-01T10:00:00Z', updated_at: '2024-02-01T10:00:00Z',
  },
  {
    id: 6, title: 'John Wick 4', original_title: 'John Wick: Chapter 4', year: 2023, media_type: 'movie',
    tmdb_id: 603692, overview: 'John Wick descubre un camino para derrotar a la Alta Mesa, pero debe enfrentarse a un nuevo enemigo.',
    poster_path: `${TMDB_IMG}/w500/mj2Z9HnRSIEk3n7yVPoOY4Uzzfh.jpg`,
    backdrop_path: `${TMDB_IMG}/w1280/7I6VUdPj6tQECNHdviJkUHD2u89.jpg`,
    rating: 7.7, vote_count: 5800, runtime: 169, status: 'completed', processing_progress: 100,
    language: 'en', filename: 'John.Wick.4.2023.1080p.mkv', path: '/api/media/6/stream',
    genres: [{ id: 1, name: 'Acción', slug: 'accion' }, { id: 8, name: 'Thriller', slug: 'thriller' }],
    actors: [{ id: 12, name: 'Keanu Reeves', photo_path: `${TMDB_IMG}/w185/4D0PpNI0hmqTDdrtkfnnGDSXCZC.jpg` }],
    created_at: '2024-01-20T10:00:00Z', updated_at: '2024-01-20T10:00:00Z',
  },
  {
    id: 7, title: 'Spider-Man: No Way Home', original_title: 'Spider-Man: No Way Home', year: 2021, media_type: 'movie',
    tmdb_id: 634649, overview: 'Peter Parker busca la ayuda del Doctor Strange para restaurar su identidad secreta.',
    poster_path: `${TMDB_IMG}/w500/miZFgV81xG324rpUknQX8dtXuBl.jpg`,
    backdrop_path: `${TMDB_IMG}/w1280/Bwh7Lol5k3hSqYOtqXWxbbJVMx.jpg`,
    rating: 8.0, vote_count: 18000, runtime: 148, status: 'completed', processing_progress: 100,
    language: 'en', filename: 'Spider-Man.No.Way.Home.2021.mkv', path: '/api/media/7/stream',
    genres: [{ id: 1, name: 'Acción', slug: 'accion' }, { id: 5, name: 'Ciencia Ficción', slug: 'ciencia-ficcion' }],
    actors: [{ id: 11, name: 'Zendaya', photo_path: `${TMDB_IMG}/w185/tylFbROxRsD1vBMGbS0pmcD4pg8.jpg` }],
    created_at: '2024-01-08T10:00:00Z', updated_at: '2024-01-08T10:00:00Z',
  },
  {
    id: 8, title: 'Gladiator II', original_title: 'Gladiator II', year: 2024, media_type: 'movie',
    tmdb_id: 558449, overview: 'Años después de presenciar la muerte del admirado héroe Máximo a manos de su tío, Lucio se ve forzado a luchar en el Coliseo.',
    poster_path: `${TMDB_IMG}/w500/ckTXrwlr4cRVxpBFEZcEmDzrmea.jpg`,
    backdrop_path: `${TMDB_IMG}/w1280/4hvK1uenpT7VVClzoNqXanvgdjX.jpg`,
    rating: 6.8, vote_count: 3200, runtime: 148, status: 'completed', processing_progress: 100,
    language: 'en', filename: 'Gladiator.II.2024.1080p.mkv', path: '/api/media/8/stream',
    genres: [{ id: 1, name: 'Acción', slug: 'accion' }, { id: 4, name: 'Drama', slug: 'drama' }],
    actors: [{ id: 8, name: 'Pedro Pascal', photo_path: `${TMDB_IMG}/w185/9VAfSEVkHeiMI2lMjGAqdRwDmme.jpg` }],
    created_at: '2024-12-01T10:00:00Z', updated_at: '2024-12-01T10:00:00Z',
  },
]

const mockSeries = [
  {
    id: 101, title: 'Breaking Bad', tmdb_id: 1396, year: 2008, media_type: 'series',
    poster_path: `${TMDB_IMG}/w500/ztkUQFLlC19CCMYHW9o1zWhJRNq.jpg`,
    backdrop_path: `${TMDB_IMG}/w1280/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg`,
    rating: 8.9, overview: 'Un profesor de química de secundaria con cáncer se convierte en fabricante de metanfetamina.',
    episode_count: 62, first_episode_id: 201,
    genres: [{ id: 4, name: 'Drama', slug: 'drama' }, { id: 12, name: 'Crimen', slug: 'crimen' }],
    created_at: '2024-01-12T10:00:00Z', updated_at: '2024-01-12T10:00:00Z',
  },
  {
    id: 102, title: 'The Last of Us', tmdb_id: 100088, year: 2023, media_type: 'series',
    poster_path: `${TMDB_IMG}/w500/tNQWO6cNzQYCyvw36mUcAQQyf5F.jpg`,
    backdrop_path: `${TMDB_IMG}/w1280/lY2DhbA7Hy44fAKddr06UrXWWaQ.jpg`,
    rating: 8.8, overview: 'Joel y Ellie cruzan lo que queda de los Estados Unidos en una América posapocalíptica.',
    episode_count: 16, first_episode_id: 202,
    genres: [{ id: 4, name: 'Drama', slug: 'drama' }, { id: 1, name: 'Acción', slug: 'accion' }],
    actors: [{ id: 8, name: 'Pedro Pascal', photo_path: `${TMDB_IMG}/w185/9VAfSEVkHeiMI2lMjGAqdRwDmme.jpg` }],
    created_at: '2024-02-05T10:00:00Z', updated_at: '2024-02-05T10:00:00Z',
  },
  {
    id: 103, title: 'Stranger Things', tmdb_id: 66732, year: 2016, media_type: 'series',
    poster_path: `${TMDB_IMG}/w500/1sRJ8D1vpXE5WQBGrUBky3uUwvX.jpg`,
    backdrop_path: `${TMDB_IMG}/w1280/8zbAoryWbtH0DKdev8abFAjdufy.jpg`,
    rating: 8.6, overview: 'Cuando un chico desaparece, su madre y amigos descubren experimentos secretos y fuerzas sobrenaturales.',
    episode_count: 34, first_episode_id: 203,
    genres: [{ id: 5, name: 'Ciencia Ficción', slug: 'ciencia-ficcion' }, { id: 13, name: 'Misterio', slug: 'misterio' }],
    created_at: '2024-01-18T10:00:00Z', updated_at: '2024-01-18T10:00:00Z',
  },
  {
    id: 104, title: 'House of the Dragon', tmdb_id: 94997, year: 2022, media_type: 'series',
    poster_path: `${TMDB_IMG}/w500/8MaxftF69sEAAD5673vTjIl8yT3.jpg`,
    backdrop_path: `${TMDB_IMG}/w1280/2xGcSLyTAzConiHAByWqhfLiatT.jpg`,
    rating: 8.4, overview: 'La historia de la casa Targaryen, 200 años antes de los eventos de Game of Thrones.',
    episode_count: 18, first_episode_id: 204,
    genres: [{ id: 10, name: 'Fantasía', slug: 'fantasia' }, { id: 4, name: 'Drama', slug: 'drama' }],
    created_at: '2024-03-01T10:00:00Z', updated_at: '2024-03-01T10:00:00Z',
  },
  {
    id: 105, title: 'Peaky Blinders', tmdb_id: 60574, year: 2013, media_type: 'series',
    poster_path: `${TMDB_IMG}/w500/zUqNyXRfYkFAFXsqJJjKMZpjYus.jpg`,
    backdrop_path: `${TMDB_IMG}/w1280/dzq83RHwQcnP6WGJ6YkenIqeaa5.jpg`,
    rating: 8.6, overview: 'Una familia de gánsters en Birmingham, Inglaterra, tras la Primera Guerra Mundial.',
    episode_count: 36, first_episode_id: 205,
    genres: [{ id: 12, name: 'Crimen', slug: 'crimen' }, { id: 4, name: 'Drama', slug: 'drama' }],
    actors: [{ id: 6, name: 'Cillian Murphy', photo_path: `${TMDB_IMG}/w185/dm6V24NjjvjMiCtbMkc8Y2WPm2e.jpg` }],
    created_at: '2024-01-25T10:00:00Z', updated_at: '2024-01-25T10:00:00Z',
  },
]

const mockAnime = [
  {
    id: 301, title: 'Attack on Titan', tmdb_id: 1429, year: 2013, media_type: 'anime',
    poster_path: `${TMDB_IMG}/w500/yFPQ4JhhirnCVe2UIKGMYX7TOGZ.jpg`,
    backdrop_path: `${TMDB_IMG}/w1280/rqbCbjB19amtOtFQbb3K2lgm2zv.jpg`,
    rating: 8.7, overview: 'Hace cien años, unas criaturas gigantescas conocidas como titanes acabaron casi con la humanidad.',
    episode_count: 87, first_episode_id: 401,
    genres: [{ id: 7, name: 'Animación', slug: 'animacion' }, { id: 1, name: 'Acción', slug: 'accion' }, { id: 15, name: 'Shonen', slug: 'shonen' }],
    created_at: '2024-02-10T10:00:00Z', updated_at: '2024-02-10T10:00:00Z',
  },
  {
    id: 302, title: 'Jujutsu Kaisen', tmdb_id: 95479, year: 2020, media_type: 'anime',
    poster_path: `${TMDB_IMG}/w500/80eHrBl03xWcQYecoTO1LlkXpN1.jpg`,
    backdrop_path: `${TMDB_IMG}/w1280/gmECX1DvFgdUPjtio2zaL8BPYPu.jpg`,
    rating: 8.6, overview: 'Un estudiante de secundaria se une a una organización secreta de hechiceros para eliminar una poderosa maldición.',
    episode_count: 48, first_episode_id: 402,
    genres: [{ id: 7, name: 'Animación', slug: 'animacion' }, { id: 1, name: 'Acción', slug: 'accion' }, { id: 15, name: 'Shonen', slug: 'shonen' }],
    created_at: '2024-02-15T10:00:00Z', updated_at: '2024-02-15T10:00:00Z',
  },
  {
    id: 303, title: 'Demon Slayer', tmdb_id: 85937, year: 2019, media_type: 'anime',
    poster_path: `${TMDB_IMG}/w500/inXU5hvbDbitrYOgLrq2QjYqiJD.jpg`,
    backdrop_path: `${TMDB_IMG}/w1280/3GQKYh6Trm8pxd2AypovoYQf4Ay.jpg`,
    rating: 8.7, overview: 'Tanjiro Kamado busca una cura para su hermana, que ha sido convertida en demonio.',
    episode_count: 55, first_episode_id: 403,
    genres: [{ id: 7, name: 'Animación', slug: 'animacion' }, { id: 1, name: 'Acción', slug: 'accion' }, { id: 15, name: 'Shonen', slug: 'shonen' }],
    created_at: '2024-01-28T10:00:00Z', updated_at: '2024-01-28T10:00:00Z',
  },
  {
    id: 304, title: 'One Piece', tmdb_id: 37854, year: 1999, media_type: 'anime',
    poster_path: `${TMDB_IMG}/w500/cMD9Ygz11zjJzAovURpO75Qg7rT.jpg`,
    backdrop_path: `${TMDB_IMG}/original/2rmK7mnchw9Xr3XdiTFSxTTLXqv.jpg`,
    rating: 8.7, overview: 'Monkey D. Luffy y su tripulación de piratas exploran el Grand Line en busca del One Piece.',
    episode_count: 1100, first_episode_id: 404,
    genres: [{ id: 7, name: 'Animación', slug: 'animacion' }, { id: 2, name: 'Aventura', slug: 'aventura' }, { id: 15, name: 'Shonen', slug: 'shonen' }],
    created_at: '2024-01-05T10:00:00Z', updated_at: '2024-01-05T10:00:00Z',
  },
  {
    id: 305, title: 'Fullmetal Alchemist: Brotherhood', tmdb_id: 31911, year: 2009, media_type: 'anime',
    poster_path: `${TMDB_IMG}/w500/vIkH7fUQf8Olo8Apq56FQLGDXOo.jpg`,
    backdrop_path: `${TMDB_IMG}/w1280/A6tMQAo6t6eRFCPhsrShmxZLqFB.jpg`,
    rating: 9.1, overview: 'Dos hermanos alquimistas buscan la Piedra Filosofal para restaurar sus cuerpos tras un ritual de transmutación fallido.',
    episode_count: 64, first_episode_id: 405,
    genres: [{ id: 7, name: 'Animación', slug: 'animacion' }, { id: 1, name: 'Acción', slug: 'accion' }, { id: 15, name: 'Shonen', slug: 'shonen' }],
    created_at: '2024-02-20T10:00:00Z', updated_at: '2024-02-20T10:00:00Z',
  },
  {
    id: 306, title: 'Death Note', tmdb_id: 13916, year: 2006, media_type: 'anime',
    poster_path: `${TMDB_IMG}/w500/cFirFPdzle2QYyjFlLVwWUP5YAo.jpg`,
    backdrop_path: `${TMDB_IMG}/w1280/mOlEbXcb6ufRJKogI35KqsSlCfB.jpg`,
    rating: 8.6, overview: 'Un estudiante genio descubre un cuaderno sobrenatural que le permite matar a cualquier persona cuyo nombre escriba.',
    episode_count: 37, first_episode_id: 406,
    genres: [{ id: 7, name: 'Animación', slug: 'animacion' }, { id: 8, name: 'Thriller', slug: 'thriller' }, { id: 16, name: 'Seinen', slug: 'seinen' }],
    created_at: '2024-01-30T10:00:00Z', updated_at: '2024-01-30T10:00:00Z',
  },
]

const mockDocumentaries = [
  {
    id: 501, title: 'Planet Earth II', tmdb_id: 68595, year: 2016, media_type: 'documentary',
    poster_path: `${TMDB_IMG}/w500/mruCboXhVXmGX7NUbD7SIfHwplG.jpg`,
    backdrop_path: `${TMDB_IMG}/w1280/mGcfMh6BndPUdKVvC5nLGKyZMa9.jpg`,
    rating: 9.0, overview: 'Documental de naturaleza narrado por David Attenborough sobre los hábitats más emblemáticos del planeta.',
    episode_count: 6, first_episode_id: 601,
    genres: [{ id: 11, name: 'Documental', slug: 'documental' }],
    created_at: '2024-03-05T10:00:00Z', updated_at: '2024-03-05T10:00:00Z',
  },
  {
    id: 502, title: 'Our Planet', tmdb_id: 83880, year: 2019, media_type: 'documentary',
    poster_path: `${TMDB_IMG}/w500/i4MBkk3JNbzqIBjFtiuKQrFkzUt.jpg`,
    backdrop_path: `${TMDB_IMG}/original/aVLAD8KgWlZ9qyDqKbkMgXjCrjp.jpg`,
    rating: 8.8, overview: 'Documental que explora la diversidad de hábitats en todo el mundo.',
    episode_count: 8, first_episode_id: 602,
    genres: [{ id: 11, name: 'Documental', slug: 'documental' }],
    created_at: '2024-02-28T10:00:00Z', updated_at: '2024-02-28T10:00:00Z',
  },
]

const mockContinueWatching = [
  {
    media_id: 1, title: 'Oppenheimer', progress_percent: 45,
    backdrop_path: `${TMDB_IMG}/w1280/ycnO0cjsAROSGJKuMODgRtWsHQw.jpg`,
    poster_path: `${TMDB_IMG}/w500/5t05uhX5ULn8Um2f1ZuznVvIffU.jpg`,
  },
  {
    media_id: 201, title: 'Breaking Bad', season_number: 3, episode_number: 7,
    episode_title: 'One Minute', progress_percent: 72,
    backdrop_path: `${TMDB_IMG}/w1280/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg`,
  },
  {
    media_id: 401, title: 'Attack on Titan', season_number: 4, episode_number: 12,
    episode_title: 'Guides', progress_percent: 30,
    backdrop_path: `${TMDB_IMG}/w1280/rqbCbjB19amtOtFQbb3K2lgm2zv.jpg`,
  },
]

export const mockStats = {
  movies: 156,
  series: 42,
  episodes: 1847,
  anime: 38,
  documentaries: 12,
  actors: 892,
  total_hours: 2340,
  total_size_gb: 4250,
}

export const mockQueueStatus = {
  status: 'idle',
  pending: 0,
  processing: 0,
  completed: 245,
  error: 3,
  pending_tasks: 0,
  active_tasks: 0,
  completed_tasks: 245,
  failed_tasks: 3,
  processing_items: [],
  recent_errors: [
    { id: 99, title: 'archivo_corrupto.mkv', filename: 'archivo_corrupto.mkv', error_message: 'Could not extract metadata' },
    { id: 100, title: 'video_sin_audio.avi', filename: 'video_sin_audio.avi', error_message: 'No audio stream found' },
  ],
}

// Helper to filter and paginate
function paginate<T>(items: T[], page: number, limit: number) {
  const start = (page - 1) * limit
  return {
    items: items.slice(start, start + limit),
    total: items.length,
    page,
    pages: Math.ceil(items.length / limit),
  }
}

// Mock API response handlers - match the exact response shapes the frontend expects
export const mockHandlers: Record<string, (url: string, params?: any) => any> = {
  // Stats
  'GET /api/stats/general': () => mockStats,
  'GET /api/stats/recent': (_url, params) => {
    const limit = params?.limit || 20
    const allMedia = [...mockMovies, ...mockSeries, ...mockAnime].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    return { media: allMedia.slice(0, limit) }
  },
  'GET /api/stats/by-genres': () => ({
    genres: mockGenres.map(g => ({ ...g, count: g.media_count }))
  }),
  'GET /api/stats/by-actors': () => ({
    actors: mockActors.slice(0, 10).map(a => ({ ...a, count: a.media_count }))
  }),
  'GET /api/stats/by-year': () => ({
    years: [
      { year: 2024, count: 15 }, { year: 2023, count: 42 }, { year: 2022, count: 35 },
      { year: 2021, count: 28 }, { year: 2020, count: 22 }, { year: 2019, count: 18 },
    ]
  }),

  // Media
  'GET /api/media': (_url, params) => {
    let items = [...mockMovies]
    if (params?.media_type && params.media_type !== 'all') {
      items = items.filter(m => m.media_type === params.media_type)
    }
    if (params?.search) {
      const s = params.search.toLowerCase()
      items = items.filter(m => m.title.toLowerCase().includes(s))
    }
    const { items: media, total, page, pages } = paginate(items, params?.page || 1, params?.limit || 24)
    return { media, total, page, pages }
  },
  'GET /api/media/:id': (url) => {
    const id = parseInt(url.split('/').pop()!)
    const all = [...mockMovies, ...mockSeries, ...mockAnime, ...mockDocumentaries]
    return all.find(m => m.id === id) || mockMovies[0]
  },
  'GET /api/media/:id/stream-info': (url) => {
    const parts = url.split('/')
    const id = parseInt(parts[parts.length - 2])
    return {
      media_id: id, filename: 'video.mp4', extension: '.mp4',
      needs_transcode: false, can_transcode: false,
      stream_url: `/api/media/${id}/stream`, native_playback: true,
    }
  },

  // Series
  'GET /api/series': (_url, params) => {
    let items = [...mockSeries]
    if (params?.search) {
      const s = params.search.toLowerCase()
      items = items.filter(m => m.title.toLowerCase().includes(s))
    }
    const { items: series, total, page, pages } = paginate(items, params?.page || 1, params?.limit || 24)
    return { series, total, page, pages }
  },
  'GET /api/series/by-tmdb/:tmdbId': (url) => {
    const tmdbId = parseInt(url.split('/').pop()!)
    const series = mockSeries.find(s => s.tmdb_id === tmdbId)
    return {
      ...series,
      episodes: Array.from({ length: series?.episode_count || 10 }, (_, i) => ({
        id: 2000 + i, title: series?.title, season_number: Math.floor(i / 10) + 1,
        episode_number: (i % 10) + 1, episode_title: `Episodio ${i + 1}`,
        media_type: 'episode', status: 'completed', processing_progress: 100,
        poster_path: series?.poster_path, rating: series?.rating,
        created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z',
      })),
    }
  },

  // Anime
  'GET /api/anime': (_url, params) => {
    let items = [...mockAnime]
    if (params?.search) {
      const s = params.search.toLowerCase()
      items = items.filter(m => m.title.toLowerCase().includes(s))
    }
    const { items: anime, total, page, pages } = paginate(items, params?.page || 1, params?.limit || 24)
    return { anime, total, page, pages }
  },
  'GET /api/anime/by-tmdb/:tmdbId': (url) => {
    const tmdbId = parseInt(url.split('/').pop()!)
    const anime = mockAnime.find(a => a.tmdb_id === tmdbId)
    return {
      ...anime,
      episodes: Array.from({ length: Math.min(anime?.episode_count || 12, 24) }, (_, i) => ({
        id: 4000 + i, title: anime?.title, season_number: Math.floor(i / 12) + 1,
        episode_number: (i % 12) + 1, episode_title: `Episodio ${i + 1}`,
        media_type: 'anime_series', status: 'completed', processing_progress: 100,
        poster_path: anime?.poster_path, rating: anime?.rating,
        created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z',
      })),
    }
  },

  // Documentaries
  'GET /api/documentaries': (_url, params) => {
    let items = [...mockDocumentaries]
    if (params?.search) {
      const s = params.search.toLowerCase()
      items = items.filter(m => m.title.toLowerCase().includes(s))
    }
    const { items: documentaries, total, page, pages } = paginate(items, params?.page || 1, params?.limit || 24)
    return { documentaries, total, page, pages }
  },
  'GET /api/documentaries/by-tmdb/:tmdbId': (url) => {
    const tmdbId = parseInt(url.split('/').pop()!)
    const doc = mockDocumentaries.find(d => d.tmdb_id === tmdbId)
    return { ...doc }
  },

  // Genres
  'GET /api/genres': () => ({ genres: mockGenres }),
  'GET /api/genres/:slug': (url) => {
    const slug = url.split('/').pop()!
    const genre = mockGenres.find(g => g.slug === slug)
    const allMedia = [...mockMovies, ...mockSeries, ...mockAnime]
    const media = allMedia.filter(m => m.genres?.some((g: any) => g.slug === slug))
    return { genre, media, total: media.length }
  },

  // Actors
  'GET /api/actors': (_url, params) => {
    let items = [...mockActors]
    if (params?.search) {
      const s = params.search.toLowerCase()
      items = items.filter(a => a.name.toLowerCase().includes(s))
    }
    const { items: actors, total, page, pages } = paginate(items, params?.page || 1, params?.limit || 48)
    return { actors, total, page, pages }
  },
  'GET /api/actors/:id': (url) => {
    const id = parseInt(url.split('/').pop()!)
    const actor = mockActors.find(a => a.id === id) || mockActors[0]
    return {
      ...actor,
      media: mockMovies.slice(0, 4).map(m => ({
        ...m, character_name: 'Personaje Principal'
      })),
    }
  },

  // Queue
  'GET /api/queue/status': () => mockQueueStatus,

  // Watch History
  'GET /api/watch-history/continue-watching': () => mockContinueWatching,
  'GET /api/watch-history/recently-watched': () => [],
  'GET /api/watch-history/:id/progress': () => ({ position: 0, duration: 0, progress_percent: 0 }),

  // POST endpoints (return success)
  'POST /api/media/scan': () => ({ message: 'Mock: Scan simulated', task_id: 'mock-task-1' }),
  'POST /api/queue/reset-stuck': () => ({ message: 'Mock: Reset simulated', count: 0 }),
}

// Match a URL pattern like '/api/media/:id' against actual URL '/api/media/123'
function matchRoute(pattern: string, method: string, url: string, reqMethod: string): boolean {
  if (method !== reqMethod) return false
  const patternParts = pattern.split('/')
  const urlParts = url.split('?')[0].split('/')
  if (patternParts.length !== urlParts.length) return false
  return patternParts.every((part, i) => part.startsWith(':') || part === urlParts[i])
}

export function getMockResponse(method: string, url: string, params?: any): any {
  const cleanUrl = url.split('?')[0]

  for (const [key, handler] of Object.entries(mockHandlers)) {
    const [routeMethod, ...routeParts] = key.split(' ')
    const routePattern = routeParts.join(' ')
    if (matchRoute(routePattern, routeMethod, cleanUrl, method)) {
      return handler(cleanUrl, params)
    }
  }

  console.warn(`[Mock] No handler for ${method} ${cleanUrl}`)
  return null
}
