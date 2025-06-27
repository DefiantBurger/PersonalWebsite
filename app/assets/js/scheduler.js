"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const COURSE_TILE_SIZE = { x: 100, y: 100 };
const COURSE_TILE_OFFSET = { x: 0, y: 0 };
let courseData; // Initialized later in main
function makeDivIntoLine(div, start, end, thickness, color) {
    const length = Math.sqrt(Math.pow((start.x - end.x), 2) + Math.pow((start.y - end.y), 2));
    const angle = Math.atan2(end.y - start.y, end.x - start.x) * (180 / Math.PI);
    const center = {
        x: (start.x + end.x) / 2 - length / 2,
        y: (start.y + end.y) / 2 - thickness / 2,
    };
    div.style.padding = "0px";
    div.style.margin = "0px";
    div.style.height = `${thickness}px`;
    div.style.backgroundColor = color;
    div.style.lineHeight = "1px";
    div.style.position = "absolute";
    div.style.left = `${center.x}px`;
    div.style.top = `${center.y}px`;
    div.style.width = `${length}px`;
    div.style.transform = `rotate(${angle}deg)`;
}
var ZIndexHierarchy;
(function (ZIndexHierarchy) {
    // The values are strings because style.zIndex expects a string
    ZIndexHierarchy["DEFAULT_COURSE_HOLDER"] = "0";
    ZIndexHierarchy["LIFTED_COURSE_HOLDER"] = "1";
    ZIndexHierarchy["PRE_REQ_LINE"] = "2";
})(ZIndexHierarchy || (ZIndexHierarchy = {}));
var Semester;
(function (Semester) {
    Semester[Semester["PRECOLLEGE"] = -1] = "PRECOLLEGE";
    Semester[Semester["FALL_24"] = 0] = "FALL_24";
    Semester[Semester["SPRING_25"] = 1] = "SPRING_25";
    Semester[Semester["FALL_25"] = 2] = "FALL_25";
    Semester[Semester["SPRING_26"] = 3] = "SPRING_26";
    Semester[Semester["FALL_26"] = 4] = "FALL_26";
    Semester[Semester["SPRING_27"] = 5] = "SPRING_27";
    Semester[Semester["FALL_27"] = 6] = "FALL_27";
    Semester[Semester["SPRING_28"] = 7] = "SPRING_28";
})(Semester || (Semester = {}));
(function (Semester) {
    function fromString(str) {
        switch (str) {
            case "precollege":
                return Semester.PRECOLLEGE;
            case "f24":
                return Semester.FALL_24;
            case "s25":
                return Semester.SPRING_25;
            case "f25":
                return Semester.FALL_25;
            case "s26":
                return Semester.SPRING_26;
            case "f26":
                return Semester.FALL_26;
            case "s27":
                return Semester.SPRING_27;
            case "f27":
                return Semester.FALL_27;
            case "s28":
                return Semester.SPRING_28;
            default:
                throw new Error("Invalid semester string");
        }
    }
    Semester.fromString = fromString;
})(Semester || (Semester = {}));
class Course {
    constructor(name, semester, credits) {
        this.name = name;
        this.semester = Semester.fromString(semester);
        this.credits = credits;
    }
}
class CourseHolder {
    constructor(course, pos, selected) {
        this.course = course;
        this.pos = pos;
        this.selected = selected;
        this.div = null;
        this.connectedReqs = [];
    }
    addConnectedReq(req) {
        this.connectedReqs.push(req);
    }
    select() {
        this.selected = true;
        this.updatePreReqLines(this.connectedReqs);
    }
    deselect() {
        this.selected = false;
        this.updatePreReqLines(this.connectedReqs);
    }
    getPos() {
        return Object.assign({}, this.pos); // Return a copy
    }
    isSelected() {
        return this.selected;
    }
    generateDiv() {
        if (this.div !== null) {
            throw new Error("Div already generated");
        }
        this.div = document.createElement("div");
        // console.log(
        //   `Generating div for course holder at pos: (${this.pos.x}, ${this.pos.y})`
        // );
        this.div.style.left = `${this.pos.x}px`;
        this.div.style.top = `${this.pos.y}px`;
        this.div.style.width = `${COURSE_TILE_SIZE.x - 4}px`;
        this.div.style.height = `${COURSE_TILE_SIZE.y - 4}px`;
        this.div.style.cursor = "grab";
        this.div.style.margin = "2px";
        this.div.style.zIndex = ZIndexHierarchy.DEFAULT_COURSE_HOLDER;
        this.div.innerHTML = this.course.name;
        return this.div;
    }
    center() {
        return {
            x: this.pos.x + COURSE_TILE_SIZE.x / 2,
            y: this.pos.y + COURSE_TILE_SIZE.y / 2,
        };
    }
    start() {
        return {
            x: this.pos.x + COURSE_TILE_SIZE.x / 4,
            y: this.pos.y + COURSE_TILE_SIZE.y / 2,
        };
    }
    end() {
        return {
            x: this.pos.x + (3 * COURSE_TILE_SIZE.x) / 4,
            y: this.pos.y + COURSE_TILE_SIZE.y / 2,
        };
    }
    updatePreReqLines(reqsToUpdate) {
        // for (const reqs of Object.values(preReqHolders)) {
        // 	for (const req of reqs) {
        // 		if (
        // 			req.courseHolder === this ||
        // 			req.reqCourseHolder === this
        // 		) {
        // 			req.generateDiv();
        // 		}
        // 	}
        // }
        for (const req of reqsToUpdate) {
            req.generateDiv();
        }
    }
    intersects(other) {
        return (this.center().x >= other.pos.x &&
            this.center().x <= other.pos.x + COURSE_TILE_SIZE.x &&
            this.center().y >= other.pos.y &&
            this.center().y <= other.pos.y + COURSE_TILE_SIZE.y);
    }
    lift() {
        if (this.div === null) {
            throw new Error("Div not generated");
        }
        this.select();
        this.div.style.cursor = "grabbing";
        this.div.style.zIndex = ZIndexHierarchy.LIFTED_COURSE_HOLDER;
        // this.div.style.border = "2px solid red";
    }
    moveTo(pos) {
        // console.log(`Moving to pos: (${pos.x}, ${pos.y})`);
        this.pos = Object.assign({}, pos); // Set a copy
        if (this.div === null) {
            throw new Error("Div not generated");
        }
        this.div.style.left = `${this.pos.x}px`;
        this.div.style.top = `${this.pos.y}px`;
        this.updatePreReqLines(this.connectedReqs);
    }
    drop() {
        if (this.div === null) {
            throw new Error("Div not generated");
        }
        this.div.style.cursor = "grab";
        this.div.style.zIndex = ZIndexHierarchy.DEFAULT_COURSE_HOLDER;
        this.snap();
    }
    snap() {
        if (this.div === null) {
            throw new Error("Div not generated");
        }
        // console.log(`Snapping starting pos: (${this.pos.x}, ${this.pos.y})`);
        let xIndex = Math.floor((this.center().x - COURSE_TILE_OFFSET.x) / COURSE_TILE_SIZE.x);
        let yIndex = Math.floor((this.center().y - COURSE_TILE_OFFSET.y) / COURSE_TILE_SIZE.y);
        xIndex = Math.max(xIndex, 0);
        yIndex = Math.max(yIndex, 0);
        this.moveTo({
            x: xIndex * COURSE_TILE_SIZE.x + COURSE_TILE_OFFSET.x,
            y: yIndex * COURSE_TILE_SIZE.y + COURSE_TILE_OFFSET.y,
        });
    }
}
class Requirement {
    constructor(courseChoices, canBeConcurrent = false) {
        this.courseChoices = courseChoices;
        this.canBeConcurrent = canBeConcurrent;
    }
    static fromList(ls, allCanBeConcurrent = false) {
        let courseChoices = [];
        const canBeConcurrent = allCanBeConcurrent || ls.join("").includes("^");
        if (canBeConcurrent) {
            for (const course of ls) {
                courseChoices.push(course.replaceAll("^", ""));
            }
        }
        else {
            courseChoices = ls;
        }
        return new Requirement(ls, canBeConcurrent);
    }
}
class CoursePreReqs {
    constructor(requirements) {
        this.requirements = requirements;
    }
    static fromCourseName(courseName) {
        const requirements = [];
        for (const group of courseData[courseName].prereqs) {
            requirements.push(Requirement.fromList(group));
        }
        for (const group of courseData[courseName].concurrent_prereqs) {
            requirements.push(Requirement.fromList(group, true));
        }
        return new CoursePreReqs(requirements);
    }
}
class PreReqHolder {
    constructor(courseHolder, reqCourseHolder, req) {
        this.courseHolder = courseHolder;
        this.reqCourseHolder = reqCourseHolder;
        this.req = req;
        this.div = document.createElement("div");
    }
    generateDiv() {
        let color;
        if (this.courseHolder.center().x >
            this.reqCourseHolder.center().x + COURSE_TILE_SIZE.x / 2) {
            color = "lime";
        }
        else if (this.courseHolder.center().x <
            this.reqCourseHolder.center().x - COURSE_TILE_SIZE.x / 2) {
            color = "red";
        }
        else if (this.req.canBeConcurrent) {
            color = "cyan";
        }
        else {
            color = "red";
        }
        this.div.style.zIndex = ZIndexHierarchy.PRE_REQ_LINE;
        makeDivIntoLine(this.div, this.reqCourseHolder.end(), this.courseHolder.start(), this.courseHolder.isSelected() || this.reqCourseHolder.isSelected()
            ? 5
            : 1, color);
        return this.div;
    }
}
function loadCourseData() {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield fetch("/assets/json/course_data.json");
        if (!response.ok)
            throw new Error("Fetch failed");
        return response.json();
    });
}
function loadCoursesJson() {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield fetch("/assets/json/courses.json");
        if (!response.ok)
            throw new Error("Fetch failed");
        return response.json();
    });
}
function generateCourses(courseJson) {
    const courses = {};
    for (const semester of Object.keys(courseJson.semesters)) {
        for (const courseName of courseJson.semesters[semester]) {
            let courseCredits;
            if ("credits" in courseData[courseName]) {
                courseCredits = courseData[courseName].credits;
            }
            else {
                courseCredits = courseData[courseName].max_credits;
            }
            courses[courseName] = new Course(courseName, semester, courseCredits);
        }
    }
    return courses;
}
function generateCourseHolders(courses) {
    var _a;
    const courseHolders = {};
    const semesterCounts = {};
    for (const course of Object.values(courses)) {
        if (!(course.semester in semesterCounts)) {
            semesterCounts[course.semester] = 0;
        }
        courseHolders[course.name] = new CourseHolder(course, {
            x: course.semester * COURSE_TILE_SIZE.x + COURSE_TILE_OFFSET.x,
            y: semesterCounts[course.semester] * COURSE_TILE_SIZE.y + COURSE_TILE_OFFSET.y,
        }, false);
        semesterCounts[course.semester] += 1;
    }
    for (const [, courseHolder] of Object.entries(courseHolders)) {
        const div = courseHolder.generateDiv();
        (_a = document.querySelector("#course-container")) === null || _a === void 0 ? void 0 : _a.appendChild(div);
    }
    return courseHolders;
}
function generatePreReqs(courses) {
    const preReqs = {};
    for (const courseName of Object.keys(courses)) {
        preReqs[courseName] = CoursePreReqs.fromCourseName(courseName);
    }
    return preReqs;
}
function generatePreReqHolders(courseHolders, preReqs) {
    var _a;
    const preReqHolders = {};
    for (const courseName of Object.keys(preReqs)) {
        const cpr = preReqs[courseName];
        for (const req of cpr.requirements) {
            let bestReqOption = null;
            for (const reqOption of req.courseChoices) {
                if (reqOption in courseHolders && ((bestReqOption === null) || (courseHolders[reqOption].course.semester < (bestReqOption === null || bestReqOption === void 0 ? void 0 : bestReqOption.course.semester)))) {
                    bestReqOption = courseHolders[reqOption];
                }
            }
            if (bestReqOption == null)
                continue;
            if (bestReqOption.course.semester <= Semester.PRECOLLEGE)
                continue;
            if (!(courseName in preReqHolders))
                preReqHolders[courseName] = [];
            preReqHolders[courseName].push(new PreReqHolder(courseHolders[courseName], courseHolders[bestReqOption.course.name], req));
        }
    }
    for (const [, preReqHolder] of Object.entries(preReqHolders)) {
        for (const req of preReqHolder) {
            const div = req.generateDiv();
            (_a = document.querySelector("#line-container")) === null || _a === void 0 ? void 0 : _a.appendChild(div);
        }
    }
    return preReqHolders;
}
function updatePreReqHolderConnections(courseHolders, preReqHolders) {
    for (const [courseName, reqs] of Object.entries(preReqHolders)) {
        for (const req of reqs) {
            courseHolders[courseName].addConnectedReq(req);
            courseHolders[req.reqCourseHolder.course.name].addConnectedReq(req);
        }
    }
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Starting JS initialization...");
        courseData = yield loadCourseData();
        const courses = generateCourses(yield loadCoursesJson());
        const courseHolders = generateCourseHolders(courses);
        const preReqs = generatePreReqs(courses);
        const preReqHolders = generatePreReqHolders(courseHolders, preReqs);
        updatePreReqHolderConnections(courseHolders, preReqHolders);
        let offsetX;
        let offsetY;
        let isDragging = false;
        let draggedCourse = null;
        document.addEventListener("mousedown", (event) => {
            for (const [, courseHolder] of Object.entries(courseHolders)) {
                courseHolder.deselect();
            }
        });
        for (const el of Array.from(document.querySelectorAll("#course-container > div"))) {
            const div = el;
            div.addEventListener("mousedown", (event) => {
                for (const [, courseHolder] of Object.entries(courseHolders)) {
                    courseHolder.deselect();
                }
                const mouseEvent = event;
                isDragging = true;
                offsetX = mouseEvent.clientX - div.offsetLeft;
                offsetY = mouseEvent.clientY - div.offsetTop;
                draggedCourse = courseHolders[div.innerText];
                draggedCourse.lift();
                event.stopPropagation();
            });
        }
        document.addEventListener("mousemove", (event) => {
            if (isDragging && draggedCourse !== null) {
                draggedCourse.moveTo({
                    x: event.clientX - offsetX,
                    y: event.clientY - offsetY,
                });
            }
        });
        document.addEventListener("mouseup", () => {
            if (isDragging && draggedCourse !== null) {
                isDragging = false;
                draggedCourse.drop();
                draggedCourse = null;
            }
        });
        console.log("Completed JS initialization!");
    });
}
main();
