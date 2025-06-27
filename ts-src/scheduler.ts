type Vec2 = {
    x: number;
    y: number;
}

type CourseDataType = {
    [courseName: string]: {
        title: string;
        prereqs: string[][];
        concurrent_prereqs: string[][];
    } & (
        | { credits: number }
        | { min_credits: number; max_credits: number }
        );
};

type CourseMap = {
    [courseName: string]: Course
}

type CourseHolderMap = {
    [courseName: string]: CourseHolder
}

type PreReqMap = {
    [courseName: string]: CoursePreReqs
}

type PreReqHolderMap = {
    [courseName: string]: PreReqHolder[]
}

const COURSE_TILE_SIZE = { x: 100, y: 100 };
const COURSE_TILE_OFFSET = { x: 0, y: 0 };

let courseData: CourseDataType; // Initialized later in main

function makeDivIntoLine(
    div: HTMLDivElement,
    start: Vec2,
    end: Vec2,
    thickness: number,
    color: string,
): void {
    const length = Math.sqrt((start.x - end.x) ** 2 + (start.y - end.y) ** 2);
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

enum ZIndexHierarchy {
    // The values are strings because style.zIndex expects a string
    DEFAULT_COURSE_HOLDER = "0",
    LIFTED_COURSE_HOLDER = "1",
    PRE_REQ_LINE = "2",
}

enum Semester {
    PRECOLLEGE = -1,
    FALL_24 = 0,
    SPRING_25 = 1,
    FALL_25 = 2,
    SPRING_26 = 3,
    FALL_26 = 4,
    SPRING_27 = 5,
    FALL_27 = 6,
    SPRING_28 = 7,
}

namespace Semester {
    export function fromString(str: string): Semester {
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
}

class Course {
    readonly name: string;
    readonly semester: Semester;
    readonly credits: number;
    constructor(
        name: string,
        semester: string,
        credits: number,
    ) {
        this.name = name;
        this.semester = Semester.fromString(semester);
        this.credits = credits;
    }
}

class CourseHolder {
    private div: HTMLDivElement | null = null;
    private connectedReqs: PreReqHolder[] = [];

    constructor(
        readonly course: Course,
        private pos: Vec2,
        private selected: boolean,
    ) { }

    addConnectedReq(req: PreReqHolder) {
        this.connectedReqs.push(req);
    }

    select(): void {
        this.selected = true;
        this.updatePreReqLines(this.connectedReqs);
    }

    deselect(): void {
        this.selected = false;
        this.updatePreReqLines(this.connectedReqs);
    }

    getPos(): Vec2 {
        return { ...this.pos }; // Return a copy
    }

    isSelected(): boolean {
        return this.selected;
    }

    generateDiv(): HTMLDivElement {
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

    center(): Vec2 {
        return {
            x: this.pos.x + COURSE_TILE_SIZE.x / 2,
            y: this.pos.y + COURSE_TILE_SIZE.y / 2,
        };
    }

    start(): Vec2 {
        return {
            x: this.pos.x + COURSE_TILE_SIZE.x / 4,
            y: this.pos.y + COURSE_TILE_SIZE.y / 2,
        };
    }

    end(): Vec2 {
        return {
            x: this.pos.x + (3 * COURSE_TILE_SIZE.x) / 4,
            y: this.pos.y + COURSE_TILE_SIZE.y / 2,
        };
    }

    updatePreReqLines(reqsToUpdate: PreReqHolder[]): void {
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

    intersects(other: CourseHolder): boolean {
        return (
            this.center().x >= other.pos.x &&
            this.center().x <= other.pos.x + COURSE_TILE_SIZE.x &&
            this.center().y >= other.pos.y &&
            this.center().y <= other.pos.y + COURSE_TILE_SIZE.y
        );
    }

    lift(): void {
        if (this.div === null) {
            throw new Error("Div not generated");
        }
        this.select();
        this.div.style.cursor = "grabbing";
        this.div.style.zIndex = ZIndexHierarchy.LIFTED_COURSE_HOLDER;
        // this.div.style.border = "2px solid red";
    }

    moveTo(pos: Vec2): void {
        // console.log(`Moving to pos: (${pos.x}, ${pos.y})`);
        this.pos = { ...pos }; // Set a copy
        if (this.div === null) {
            throw new Error("Div not generated");
        }
        this.div.style.left = `${this.pos.x}px`;
        this.div.style.top = `${this.pos.y}px`;

        this.updatePreReqLines(this.connectedReqs);
    }

    drop(): void {
        if (this.div === null) {
            throw new Error("Div not generated");
        }
        this.div.style.cursor = "grab";
        this.div.style.zIndex = ZIndexHierarchy.DEFAULT_COURSE_HOLDER;
        this.snap();
    }

    snap(): void {
        if (this.div === null) {
            throw new Error("Div not generated");
        }
        // console.log(`Snapping starting pos: (${this.pos.x}, ${this.pos.y})`);
        let xIndex = Math.floor((this.center().x - COURSE_TILE_OFFSET.x) / COURSE_TILE_SIZE.x)
        let yIndex = Math.floor((this.center().y - COURSE_TILE_OFFSET.y) / COURSE_TILE_SIZE.y)
        xIndex = Math.max(xIndex, 0);
        yIndex = Math.max(yIndex, 0);
        this.moveTo({
            x:
                xIndex * COURSE_TILE_SIZE.x + COURSE_TILE_OFFSET.x,
            y:
                yIndex * COURSE_TILE_SIZE.y + COURSE_TILE_OFFSET.y,
        });
    }
}

class Requirement {
    constructor(
        readonly courseChoices: string[],
        readonly canBeConcurrent = false,
    ) { }

    static fromList(ls: string[], allCanBeConcurrent = false) {
        let courseChoices: string[] = [];
        const canBeConcurrent = allCanBeConcurrent || ls.join("").includes("^");
        if (canBeConcurrent) {
            for (const course of ls) {
                courseChoices.push(course.replaceAll("^", ""));
            }
        } else {
            courseChoices = ls;
        }
        return new Requirement(ls, canBeConcurrent);
    }
}

class CoursePreReqs {
    constructor(readonly requirements: Requirement[]) { }

    static fromCourseName(courseName: string) {
        const requirements: Requirement[] = [];
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
    private div: HTMLDivElement = document.createElement("div");

    constructor(
        readonly courseHolder: CourseHolder,
        readonly reqCourseHolder: CourseHolder,
        readonly req: Requirement,
    ) { }

    generateDiv(): HTMLDivElement {
        let color: string;
        if (
            this.courseHolder.center().x >
            this.reqCourseHolder.center().x + COURSE_TILE_SIZE.x / 2
        ) {
            color = "lime";
        } else if (
            this.courseHolder.center().x <
            this.reqCourseHolder.center().x - COURSE_TILE_SIZE.x / 2
        ) {
            color = "red";
        } else if (this.req.canBeConcurrent) {
            color = "cyan";
        } else {
            color = "red";
        }

        this.div.style.zIndex = ZIndexHierarchy.PRE_REQ_LINE;

        makeDivIntoLine(
            this.div,
            this.reqCourseHolder.end(),
            this.courseHolder.start(),
            this.courseHolder.isSelected() || this.reqCourseHolder.isSelected()
                ? 5
                : 1,
            color,
        );

        return this.div;
    }
}

async function loadCourseData() {
    const response = await fetch("/assets/json/course_data.json");
    if (!response.ok) throw new Error("Fetch failed");
    return response.json();
}

async function loadCoursesJson() {
    const response = await fetch("/assets/json/courses.json");
    if (!response.ok) throw new Error("Fetch failed");
    return response.json();

}

function generateCourses(courseJson: { semesters: { [x: string]: string[]; }; }) {
    const courses: CourseMap = {}

    for (const semester of Object.keys(courseJson.semesters)) {
        for (const courseName of courseJson.semesters[semester]) {
            let courseCredits: number;
            if ("credits" in courseData[courseName]) {
                courseCredits = courseData[courseName].credits
            } else {
                courseCredits = courseData[courseName].max_credits
            }
            courses[courseName] = new Course(courseName, semester, courseCredits);
        }
    }

    return courses;
}

function generateCourseHolders(courses: CourseMap) {
    const courseHolders: CourseHolderMap = {};

    const semesterCounts: { [key in Semester]?: number } = {};

    for (const course of Object.values(courses)) {
        if (!(course.semester in semesterCounts)) {
            semesterCounts[course.semester] = 0;
        }

        courseHolders[course.name] = new CourseHolder(
            course,
            {
                x: course.semester * COURSE_TILE_SIZE.x + COURSE_TILE_OFFSET.x,
                y: semesterCounts[course.semester]! * COURSE_TILE_SIZE.y + COURSE_TILE_OFFSET.y,
            },
            false,
        );

        semesterCounts[course.semester]! += 1;
    }

    for (const [, courseHolder] of Object.entries(courseHolders)) {
        const div = courseHolder.generateDiv();
        document.querySelector("#course-container")?.appendChild(div);
    }

    return courseHolders;
}

function generatePreReqs(courses: CourseMap) {
    const preReqs: PreReqMap = {};

    for (const courseName of Object.keys(courses)) {
        preReqs[courseName] = CoursePreReqs.fromCourseName(courseName);
    }

    return preReqs;
}

function generatePreReqHolders(courseHolders: CourseHolderMap, preReqs: PreReqMap) {
    const preReqHolders: PreReqHolderMap = {};

    for (const courseName of Object.keys(preReqs)) {
        const cpr = preReqs[courseName];
        for (const req of cpr.requirements) {
            let bestReqOption: CourseHolder | null = null;
            for (const reqOption of req.courseChoices) {
                if (reqOption in courseHolders && (
                    (bestReqOption === null) || (courseHolders[reqOption].course.semester < bestReqOption?.course.semester)
                )) {
                    bestReqOption = courseHolders[reqOption]
                }
            }

            if (bestReqOption == null)
                continue;

            if (bestReqOption.course.semester <= Semester.PRECOLLEGE)
                continue;

            if (!(courseName in preReqHolders))
                preReqHolders[courseName] = []
            preReqHolders[courseName].push(new PreReqHolder(
                courseHolders[courseName],
                courseHolders[bestReqOption.course.name],
                req
            ))
        }
    }

    for (const [, preReqHolder] of Object.entries(preReqHolders)) {
        for (const req of preReqHolder) {
            const div = req.generateDiv()
            document.querySelector("#line-container")?.appendChild(div);
        }
    }

    return preReqHolders;
}

function updatePreReqHolderConnections(
    courseHolders: CourseHolderMap,
    preReqHolders: PreReqHolderMap
) {
    for (const [courseName, reqs] of Object.entries(preReqHolders)) {
        for (const req of reqs) {
            courseHolders[courseName].addConnectedReq(req);
            courseHolders[req.reqCourseHolder.course.name].addConnectedReq(req)
        }
    }
}


async function main() {
    console.log("Starting JS initialization...")
    courseData = await loadCourseData();

    const courses = generateCourses(await loadCoursesJson());
    const courseHolders = generateCourseHolders(courses);
    const preReqs = generatePreReqs(courses);
    const preReqHolders = generatePreReqHolders(courseHolders, preReqs);

    updatePreReqHolderConnections(courseHolders, preReqHolders);

    let offsetX: number;
    let offsetY: number;
    let isDragging = false;
    let draggedCourse: CourseHolder | null = null;

    document.addEventListener("mousedown", (event) => {
        for (const [, courseHolder] of Object.entries(courseHolders)) {
            courseHolder.deselect();
        }
    });

    for (const el of Array.from(document.querySelectorAll("#course-container > div"))) {
        const div = el as HTMLDivElement;
        div.addEventListener("mousedown", (event) => {
            for (const [, courseHolder] of Object.entries(courseHolders)) {
                courseHolder.deselect();
            }

            const mouseEvent = event as MouseEvent;
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

    console.log("Completed JS initialization!")
}

main();