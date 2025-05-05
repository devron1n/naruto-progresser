/**
 * Скрипт для преобразования markdown-файла с сериями Наруто в JSON формат
 */

// Функция для парсинга markdown файла
function parseMdToJson(mdContent) {
  const result = {
    seasons: [],
    movies: [],
    episodes: [],
  };

  // Регулярные выражения
  const seasonRegex = /## Сезон (\d+): ([^(]+) \((\d{4}(?:-\d{4})?)\)/g;
  const episodeRegex = /- \[ \] (\d+)\. "([^"]+)"(?:\s*\(([^)]+)\))?/g;
  const movieRegex = /\*\*\*Полнометражный фильм: "([^"]+)" \((\d{4})\)\*\*\*/g;

  // Индекс текущего сезона для привязки фильмов к эпизодам
  let currentSeasonEndEpisode = 0;

  // Найти все сезоны
  let seasonMatch;
  while ((seasonMatch = seasonRegex.exec(mdContent)) !== null) {
    const seasonId = parseInt(seasonMatch[1]);
    const seasonTitle = seasonMatch[2].trim();
    const seasonYear = seasonMatch[3];

    // Найти диапазон эпизодов для этого сезона
    const seasonContent = mdContent.substring(seasonMatch.index);
    const nextSeasonIndex = seasonContent.indexOf("## Сезон", 2); // Пропускаем текущее совпадение

    const seasonTextEnd =
      nextSeasonIndex !== -1
        ? seasonMatch.index + nextSeasonIndex
        : mdContent.length;

    const seasonText = mdContent.substring(seasonMatch.index, seasonTextEnd);

    // Получаем первый и последний эпизод сезона
    const episodeMatches = [...seasonText.matchAll(episodeRegex)];

    if (episodeMatches.length > 0) {
      const startEpisode = parseInt(episodeMatches[0][1]);
      const endEpisode = parseInt(episodeMatches[episodeMatches.length - 1][1]);

      currentSeasonEndEpisode = endEpisode;

      result.seasons.push({
        id: seasonId,
        title: seasonTitle,
        start: startEpisode,
        end: endEpisode,
      });
    }
  }

  // Найти все фильмы
  let movieMatch;
  let lastEpisodeBeforeMovie = 0;
  while ((movieMatch = movieRegex.exec(mdContent)) !== null) {
    // Ищем номер последнего эпизода перед фильмом
    const beforeMovieContent = mdContent.substring(0, movieMatch.index);
    const episodeMatches = [...beforeMovieContent.matchAll(episodeRegex)];

    if (episodeMatches.length > 0) {
      lastEpisodeBeforeMovie = parseInt(
        episodeMatches[episodeMatches.length - 1][1]
      );
    }

    result.movies.push({
      id: result.movies.length + 1,
      title: movieMatch[1],
      after_episode: lastEpisodeBeforeMovie,
    });
  }

  // Найти все эпизоды
  let episodeMatch;
  while ((episodeMatch = episodeRegex.exec(mdContent)) !== null) {
    const episodeNumber = parseInt(episodeMatch[1]);
    const episodeTitle = episodeMatch[2].trim();
    const filler = episodeMatch[3] ? episodeMatch[3].includes("филлер") : false;

    result.episodes.push({
      number: episodeNumber,
      title: episodeTitle,
      filler: filler,
      watched: false,
    });
  }

  return result;
}

// Пример использования функции
function convertMarkdownToJson(mdContentStr) {
  const jsonData = parseMdToJson(mdContentStr);
  return JSON.stringify(jsonData, null, 2);
}

// Если скрипт запускается в Node.js
if (typeof require !== "undefined") {
  const fs = require("fs");

  // Чтение файла и обработка
  fs.readFile("naruto-series.md", "utf8", (err, data) => {
    if (err) {
      console.error("Ошибка при чтении файла:", err);
      return;
    }

    const jsonResult = convertMarkdownToJson(data);

    // Запись результата в файл
    fs.writeFile("naruto-series.json", jsonResult, "utf8", (err) => {
      if (err) {
        console.error("Ошибка при записи файла:", err);
        return;
      }
      console.log("Файл naruto-series.json успешно создан!");
    });
  });
}

// Если скрипт используется в браузере, экспортируем функцию
if (typeof window !== "undefined") {
  window.convertMarkdownToJson = convertMarkdownToJson;
}
