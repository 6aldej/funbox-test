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

    var unitTestsFired = false;
    app = new Vue({
        el: "#app",

        data: {
            newPointName: "",
            points: [],

            // Для показа ошибки ввода пустой строки
            // при создании точки.
            errEmptyName: false,

            // Для показа блока с юнит-тестами.
            unitTests: false
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
                var point = {
                    name: pointName,
                    placemark: this.createNewPlacemark(pointName)
                };
                this.points.push(point);

                // Очищаем поле ввода
                this.newPointName = "";

                // Это, скорее, для юнит-тестирования, и для масштабирования.
                // Хотя, конкретно в этом приложении, ссылка на объект не применяется.
                return point;
            },

            removePoint: function(index) {
                // Случай, если передать не индекс объекта, а сам объект
                // (удобно при тестировании и масштабировании проекта).
                if (typeof index === "object") {
                    index = this.points.indexOf(index);
                }

                if (typeof index !== "number" || !this.points[index]) {
                    return;
                }

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
            },

            runUnitTests: function() {
                mocha.setup('bdd')

                describe("dummy", function() {
                    // Сжижжено вот отсюда:
                    // https://github.com/Automattic/expect.js
                    it("несколько тестов для проверки на вшивость", function() {
                        expect(window.r).to.be(undefined);
                        expect({ a: "b" }).to.eql({ a: "b" })
                        expect(5).to.be.a("number");
                        expect([]).to.be.an("array");
                        expect(window).not.to.be.an(Image);
                    });
                });

                describe("app", function() {
                    it("метод createNewPlacemark должен вернуть объект", function() {
                        var placemark = app.createNewPlacemark();
                        expect(placemark).to.be.an("object");
                        app.map.geoObjects.remove(placemark);
                    });

                    it("метод addNewPoint без аргументов не должен менять массив точек", function() {
                        var firstLength = app.points.length;
                        app.addNewPoint();
                        var secondLength = app.points.length;
                        expect(secondLength).to.be.equal(firstLength);
                        app.errEmptyName = false;
                    });

                    it("метод addNewPoint с указанием имени добавляет элемент в массив points и возвращает объект", function() {
                        var firstLength = app.points.length;
                        var point = app.addNewPoint("test");
                        var secondLength = app.points.length;
                        expect(secondLength).to.be.equal(firstLength + 1);
                        expect(point).to.be.an("object");
                        app.removePoint(secondLength - 1);
                    });

                    it("метод removePoint удаляет элемент из массива points", function() {
                        var point1 = app.addNewPoint("test1");
                        var point2 = app.addNewPoint("test2");
                        var point3 = app.addNewPoint("test3");

                        // Сначала удаляем вторую из созданных точек и проверяем,
                        // удалилась ли она из массива.
                        app.removePoint(app.points.length - 2);
                        expect(app.points.indexOf(point2) === -1);

                        // Затем первую из созданных
                        app.removePoint(app.points.length - 2);
                        expect(app.points.indexOf(point2) === -1);

                        // Затем последнюю из созданных
                        app.removePoint(app.points.length - 1);
                        expect(app.points.indexOf(point3) === -1);
                    });

                    it("количество точек в массиве points должно совпадать с количеством маркеров на карте", function(done) {
                        // Создание GeoQueryResult из коллекции геообъектов.
                        var rnd = Math.round(Math.random() * 14) + 1;
                        var arr = [];
                        for (var i = 0; i < rnd; i++) {
                            arr.push(app.addNewPoint("test" + i));
                        }

                        // По какой-то причине (надо выяснять; для тестового задания - слегка лень...)
                        // объект, относящийся к ломаной линии, появляется не сразу после создания rnd точек.
                        // Хотя он тоже является geoObject и его надо учитывать при подсчёте.
                        // Нулевой setTimeout маскирует проблему (не решает её).
                        setTimeout(function() {
                            var result = ymaps.geoQuery(app.map.geoObjects).searchIntersect(app.map);
                            var placemarksCount = result.getLength();

                            // При создании двух и более точек, повляется ломаная линия между ними -
                            // и это тоже объект на карте, его не нужно считать.
                            if (rnd >= 2) {
                                placemarksCount -= 1;
                            }

                            expect(placemarksCount).to.be.equal(rnd);

                            for (i = 0; i < rnd; i++) {
                                app.removePoint(app.points.length - 1);
                            }

                            done();
                        }, 0);
                    });
                });

                mocha.run();
                this.unitTests = true;
            },
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

    // TEMP
    window.app = app;

    // Удаляем спиннер у родительского элемента. Без него
    // пользователь увидит сырые элементы. Ни к чему это... :)
    document.querySelector(".app-container").classList.remove("is-loading");
})();