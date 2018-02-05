// Код обёрнут в немедленно-вызываемую функцию,
// чтобы не засорять глобальное пространство имён.
(function mainApp() {
    ymaps.ready(init);
    var app;

    // После инициализации библиотеки,
    // создаём экземпляр карты.
    function init() {
        var map = new ymaps.Map("map", {
            // Пальцем в небо!
            // Ладно, мне просто нравится соляное озеро Эльтон. Был там уже два раза, и ещё поеду.
            center: [49.133333, 46.666667],
            zoom: 11
        });

        // Экспорт переменной,
        // для использования в других частях приложения.
        app.map = map;
    }

    app = new Vue({
        el: "#app",

        data: {
            newPointName: "",
            points: [],

            // Для показа ошибки ввода пустой строки
            // при создании точки
            errEmptyName: false
        },

        methods: {
            addNewPoint: function(pointName) {
                // Обработка ошибок
                // (при желании, можно написать более серьёзные проверки).
                if (!pointName) {
                    this.errEmptyName = true;
                    return;
                }
                this.errEmptyName = false;

                // Создаём новую точку, с заданным именем,
                // и передаём ей маркер Якарт в виде ссылки на объект
                // (возвращается в функции через return).
                // При этом ломаная линия обновится автоматически,
                // так как ниже прописан вотчер для массива points.
                this.points.push({
                    name: pointName,
                    placemark: this.createNewPlacemark(pointName)
                });

                // Очищаем поле ввода
                this.newPointName = "";
            },

            removePoint: function(index) {
                // Получаем ссылку на объект, чтобы его можно было
                // передать в API Якарт, для удаления.
                var placemark = this.points[index].placemark;
                app.map.geoObjects.remove(placemark);

                // Удаляем выбранную точку из массива.
                // При этом ломаная линия обновится автоматически,
                // так как ниже прописан вотчер для массива points.
                this.points.splice(index, 1);
            },

            createNewPlacemark: function(name) {
                var placemark = new ymaps.Placemark(
                    // Создаём новый маркер в центре карты.
                    app.map.getCenter(),
                    {
                        // При клике на маркер, появится название точки.
                        balloonContent: name
                    },
                    {
                        // Для того, чтобы можно было перетаскивать маркер.
                        draggable: true
                    }
                );

                // Новому маркеру необходим обработчик события перетаскивания,
                // чтобы обновлять ломаную линию.
                placemark.events.add("dragend", this.updatePolyline);

                app.map.geoObjects.add(placemark);

                // Возвращаем экземпляр маркера, чтобы на него
                // можно было сослаться в дальнейшем.
                return placemark;
            },

            updatePolyline: function() {
                // Если в массиве менее двух точек,
                // то завершаем выполнение функции.
                if (this.points.length < 2) {
                    app.polyline = undefined;
                    return;
                }

                // Собираем координаты всех точек, чтобы далее по ним
                // составить ломаную линию.
                var coordsArr = [];
                for (var i = 0, len = this.points.length; i < len; i++) {
                    // Здесь наглядно видно, какую роль играют ссылки на объекты из Якарт:
                    // не нужно хранить координаты точек в исходном массиве points.
                    coordsArr.push(this.points[i].placemark.geometry.getCoordinates());
                }

                // Честно говоря, пока что так и не понял, можно ли в Якартах обновить данные
                // ломаной линии. Поэтому, пока что приходится удалять одну линию, и рисовать новую.
                // Это, конечно, не совсем айс, если, действительно, есть вариант обновить данные линии.
                var line = new ymaps.Polyline(coordsArr);
                if (app.polyline !== undefined) {
                    app.map.geoObjects.remove(app.polyline);
                }
                app.map.geoObjects.add(line);

                // Ссылка на объект Якарт необходима, чтобы можно было в дальнейшем
                // удалить этот объект (см. предысторию чуть выше).
                app.polyline = line;
            }
        },

        watch: {
            // Простой вотчер, который следит за исходным массивом точек,
            // и обновляет ломаную линию при изменении данных.
            // Как минимум, это необходимо при перетаскивании элементов списка
            // (т. к. используется стороняя библиотека, и лень было в ней копаться -
            // может быть там был метод onUpdate, или что-то подобное).
            points: function() {
                this.updatePolyline();
            }
        }
    });

    document.querySelector(".form").classList.remove("is-loading");
})();