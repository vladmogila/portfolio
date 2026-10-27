# Портфолио Влада Могилы

Одностраничный сайт-портфолио на чистом HTML/CSS/JS: без сборщиков и зависимостей.

- Русская версия — `docs/index.html`
- Английская версия — `docs/en/index.html`
- Адрес после публикации: **https://vladmogila.github.io/portfolio/** (англ.: `/portfolio/en/`)

## Структура

```
works/                 исходники работ, по папке на проект (на сайт не публикуются)
docs/                  готовый сайт — именно эта папка публикуется на GitHub Pages
  index.html           RU
  en/index.html        EN
  assets/css/style.css стили
  assets/js/main.js    фильтр кейсов, просмотр картинок, автозапуск видео
  assets/works/        оптимизированные изображения и видео
  assets/fonts/        шрифты Unbounded и Manrope (лицензия SIL OFL)
  assets/og-ru.jpg     превью для соцсетей (1200×630), og-en.jpg — для английской версии
scripts/optimize.py    оптимизация изображений и видео из works/
scripts/og/            шаблоны и рендер превью для соцсетей
```

## Как включить GitHub Pages

1. Влейте ветку с сайтом в `main` (через pull request на GitHub или локально `git merge`).
2. На GitHub откройте репозиторий → **Settings** → **Pages**.
3. В блоке **Build and deployment** выберите **Source: Deploy from a branch**.
4. В **Branch** выберите `main`, папку **`/docs`** и нажмите **Save**.
5. Через 1–2 минуты сайт откроется по адресу https://vladmogila.github.io/portfolio/ — ссылка появится вверху страницы Settings → Pages.

Каждый следующий push в `main` обновляет сайт автоматически.

> Репозиторий должен быть публичным: на бесплатном тарифе GitHub Pages работает только с публичными репозиториями.

**Если адрес другой** (переименовали репозиторий или подключили свой домен), замените `https://vladmogila.github.io/portfolio/` на новый адрес в `docs/index.html`, `docs/en/index.html` (теги `canonical`, `hreflang`, `og:*`, `twitter:*`), `docs/sitemap.xml` и `docs/robots.txt`. Иначе превью в соцсетях не подтянется.

## Что заполнить перед публикацией

Черновые места помечены `[ЗАПОЛНИТЬ…]` и подсвечены на сайте жёлтым. Найти все:

```bash
grep -rn "ЗАПОЛНИТЬ" docs/
```

Текст правится прямо в `docs/index.html` и `docs/en/index.html`. Заполненное место замените целиком вместе с обёрткой `<mark class="todo">…</mark>`.

Что там сейчас:
- в каждом кейсе — клиент или «концепт», площадка, что делали сами, результат (без выдуманных цифр: если метрик нет, напишите, что приняли с первого раза, сроки или отзыв);
- цена AI-визуала в услугах;
- в английской версии — цены в USD/EUR, если хотите показывать их иностранным клиентам.

## Как добавить новую работу

1. Положите файлы в `works/<название проекта>/`.
2. Добавьте строки в список `MEDIA` в `scripts/optimize.py`: папка, файл, папка на сайте, латинское имя.
3. Запустите из корня репозитория (нужны Python с Pillow и ffmpeg для видео):
   ```bash
   pip install pillow
   python3 scripts/optimize.py
   ```
   Изображения станут WebP: полная версия до 2000 px по длинной стороне и превью до 800 px (`-thumb.webp`). Видео пережимается в MP4 до 720 px по ширине, к нему создаётся постер. Размеры файлов скрипт записывает в `scripts/media.json`.
4. Скопируйте любой блок `<article class="case">` в обоих HTML-файлах и поменяйте тексты, `id`, `data-cat` (`ecom`, `ads`, `print` или `motion`) и пути к картинкам. Атрибуты `width`/`height` возьмите из `scripts/media.json`.

## Превью для соцсетей

Картинки `docs/assets/og-ru.jpg` и `og-en.jpg` собираются из шаблонов `scripts/og/og-*.html`. Чтобы пересобрать после правок:

```bash
npm install playwright && npx playwright install chromium
node scripts/og/render.js
```

Проверить, как ссылка выглядит в соцсетях, можно отправив её себе в Telegram. Telegram кэширует превью: обновить его можно через бота @WebpageBot.

## Локальный просмотр

```bash
python3 -m http.server -d docs 8000
```

Затем откройте http://localhost:8000. Если открыть `index.html` двойным кликом, браузер может не подгрузить шрифты.
