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

const COURSE_TILE_SIZE = {x: 100, y: 100};
const COURSE_TILE_OFFSET = {x: 0, y: 0};

let courseData: CourseDataType; // Initialized later in main

enum ZIndexHierarchy {
    // The values are strings because style.zIndex expects a string
    DEFAULT_COURSE_HOLDER = "0",
    LIFTED_COURSE_HOLDER = "1",
    PRE_REQ_LINE = "2",
}

function makeDivIntoLine(
    div: HTMLDivElement,
    start: Vec2,
    end: Vec2,
    thickness: number,
    color: string,
    opacity: number,
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
    div.style.opacity = `${opacity}`;
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
            case "f1":
                return Semester.FALL_24;
            case "s1":
                return Semester.SPRING_25;
            case "f2":
                return Semester.FALL_25;
            case "s2":
                return Semester.SPRING_26;
            case "f3":
                return Semester.FALL_26;
            case "s3":
                return Semester.SPRING_27;
            case "f4":
                return Semester.FALL_27;
            case "s4":
                return Semester.SPRING_28;
            default:
                throw new Error("Invalid semester string");
        }
    }

    export function toString(semester: Semester): string {
        switch (semester) {
            case Semester.PRECOLLEGE:
                return "precollege";
            case Semester.FALL_24:
                return "f1";
            case Semester.SPRING_25:
                return "s1";
            case Semester.FALL_25:
                return "f2";
            case Semester.SPRING_26:
                return "s2";
            case Semester.FALL_26:
                return "f3";
            case Semester.SPRING_27:
                return "s3";
            case Semester.FALL_27:
                return "f4";
            case Semester.SPRING_28:
                return "s4";
            default:
                throw new Error("Invalid semester");
        }
    }
}

class Course {
    readonly name: string;
    semester: Semester;
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
        public reqSatisPercent: number | null = null,
    ) {
    }

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
        return {...this.pos}; // Return a copy
    }

    isSelected(): boolean {
        return this.selected;
    }

    generateRequirementSatisfactionBar(): HTMLDivElement {
        let reqSatisDivContainer = document.createElement("div");

        let reqUnsatisDiv = document.createElement("div");
        reqUnsatisDiv.style.left = "0px";
        reqUnsatisDiv.style.top = `${COURSE_TILE_SIZE.y - 4 - 4}px`;
        reqUnsatisDiv.style.width = "100%";
        reqUnsatisDiv.style.height = "2px";
        reqUnsatisDiv.style.position = "absolute";
        if (this.reqSatisPercent !== null) {
            reqUnsatisDiv.style.backgroundColor = "red";
        }
        reqSatisDivContainer.appendChild(reqUnsatisDiv);

        let reqSatisDiv = document.createElement("div");
        reqSatisDiv.style.left = "0px";
        reqSatisDiv.style.top = `${COURSE_TILE_SIZE.y - 4 - 4}px`;
        reqSatisDiv.style.height = "2px";
        reqSatisDiv.style.position = "absolute";
        if (this.reqSatisPercent !== null) {
            reqSatisDiv.style.backgroundColor = "lime";
            reqSatisDiv.style.width = `${this.reqSatisPercent}%`;
        }
        reqSatisDivContainer.appendChild(reqSatisDiv);

        return reqSatisDivContainer;
    }

    addRequirementSatisfactionBar(): void {
        if (this.div === null) {
            throw new Error("Div not generated");
        }
        this.div.appendChild(this.generateRequirementSatisfactionBar())
    }

    generateDiv(): HTMLDivElement {
        if (this.div !== null) {
            throw new Error("Div already generated");
        }
        this.div = document.createElement("div");

        if (this.course.semester === Semester.PRECOLLEGE) {
            this.div.style.display = "none";
            return this.div; // Do not generate a div for precollege courses
        }

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
        this.pos = {...pos}; // Set a copy
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

        this.course.semester = xIndex;
    }
}

class Requirement {
    constructor(
        readonly courseChoices: string[],
        readonly canBeConcurrent = false,
    ) {
    }

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
        return new Requirement(courseChoices, canBeConcurrent);
    }
}

class CoursePreReqs {
    constructor(readonly requirements: Requirement[]) {
    }

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
    ) {
    }

    generateDiv(): HTMLDivElement {
        let color: string;
        let validReqPos = this.courseHolder.center().x > this.reqCourseHolder.center().x + COURSE_TILE_SIZE.x / 2
        let invalidReqPos = this.courseHolder.center().x < this.reqCourseHolder.center().x - COURSE_TILE_SIZE.x / 2
        if (validReqPos && !this.req.canBeConcurrent) {
            color = "lime";
        } else if (invalidReqPos) {
            color = "red";
        } else if (this.req.canBeConcurrent) {
            color = "cyan";
        } else {
            color = "red";
        }

        this.div.style.zIndex = ZIndexHierarchy.PRE_REQ_LINE;

        let lineStart: Vec2;
        let lineEnd: Vec2;
        if (this.req.canBeConcurrent) {
            lineStart = this.reqCourseHolder.center()
            lineEnd = this.courseHolder.center()
        } else {
            lineStart = this.reqCourseHolder.end()
            lineEnd = this.courseHolder.start()
        }

        makeDivIntoLine(
            this.div,
            lineStart,
            lineEnd,
            this.courseHolder.isSelected() || this.reqCourseHolder.isSelected()
                ? 5
                : 1,
            color,
            this.courseHolder.isSelected() || this.reqCourseHolder.isSelected()
                ? 1.0
                : 0.5,
        );

        return this.div;
    }
}

async function loadCourseData() {
    const response = await fetch("/assets/json/course_data.json");
    if (!response.ok) throw new Error("Fetch failed");
    return response.json();
}

async function loadCoursesExampleJson() {
    const response = await fetch("/assets/json/courses_example.json");
    if (!response.ok) throw new Error("Fetch failed");
    return response.json();
}

function clearAllCourses() {
    const courseContainer = document.querySelector("#course-container");
    const lineContainer = document.querySelector("#line-container");

    if (courseContainer) {
        courseContainer.innerHTML = "";
    }
    if (lineContainer) {
        lineContainer.innerHTML = "";
    }
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
            false
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
        let expectedReqCount = cpr.requirements.length;
        let actualReqCount = 0;

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

            if (bestReqOption.course.semester <= Semester.PRECOLLEGE) {
                expectedReqCount -= 1;
                continue;
            }
            actualReqCount += 1;

            if (!(courseName in preReqHolders))
                preReqHolders[courseName] = []
            preReqHolders[courseName].push(new PreReqHolder(
                courseHolders[courseName],
                courseHolders[bestReqOption.course.name],
                req
            ))
        }

        if (expectedReqCount > 0) {
            console.log(`Course: ${courseName} - Actual Req Count: ${actualReqCount}, Expected Req Count: ${expectedReqCount}`);
            courseHolders[courseName].reqSatisPercent = (actualReqCount / expectedReqCount) * 100;
            courseHolders[courseName].addRequirementSatisfactionBar();
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

function updatePreReqHolderConnections(courseHolders: CourseHolderMap, preReqHolders: PreReqHolderMap) {
    for (const [courseName, reqs] of Object.entries(preReqHolders)) {
        for (const req of reqs) {
            courseHolders[courseName].addConnectedReq(req);
            courseHolders[req.reqCourseHolder.course.name].addConnectedReq(req)
        }
    }
}

function initializeSchedule(courseJson: any): CourseHolderMap {
    console.log("Initializing schedule with course data...");

    // Clear existing courses and lines
    clearAllCourses();

    const courses = generateCourses(courseJson);
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

    console.log("Schedule initialization completed!");
    return courseHolders;
}

function exportSchedule(courseHolders: CourseHolderMap) {

    // Group courses by semester
    const semesterMap: { [semester: string]: string[] } = {};

    for (const [courseName, courseHolder] of Object.entries(courseHolders)) {
        const semesterStr = Semester.toString(courseHolder.course.semester);

        if (!(semesterStr in semesterMap)) {
            semesterMap[semesterStr] = [];
        }

        semesterMap[semesterStr].push(courseName);
    }

    // Create the output JSON structure
    const outputJson = {
        semesters: semesterMap
    };

    // Convert to JSON string with nice formatting
    const jsonString = JSON.stringify(outputJson, null, "\t");

    // Create a blob and download it
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `schedule_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log("Schedule exported successfully!");
}

async function main() {
    console.log("Starting JS initialization...")
    courseData = await loadCourseData();

    // Load and initialize with default example courses
    const defaultCourseJson = await loadCoursesExampleJson();
    let currentCourseHolders = initializeSchedule(defaultCourseJson);

    // Set up file upload and generate button
    const fileInput = document.getElementById("file-input") as HTMLInputElement;
    const generateButton = document.getElementById("generate-button") as HTMLButtonElement;
    const exportButton = document.getElementById("export-button") as HTMLButtonElement;

    generateButton.addEventListener("click", async () => {
        const file = fileInput.files?.[0];

        if (!file) {
            alert("Please select a JSON file first!");
            return;
        }

        try {
            const fileContent = await file.text();
            const courseJson = JSON.parse(fileContent);

            // Validate the JSON structure
            if (!courseJson.semesters || typeof courseJson.semesters !== "object") {
                alert("Invalid JSON format! Expected a 'semesters' object.");
                return;
            }

            currentCourseHolders = initializeSchedule(courseJson);
            console.log("Schedule regenerated from uploaded file!");
        } catch (error) {
            console.error("Error loading file:", error);
            alert("Error loading or parsing the JSON file. Please check the file format.");
        }
    });

    exportButton.addEventListener("click", () => {
        if (Object.keys(currentCourseHolders).length === 0) {
            alert("No schedule to export! Please generate a schedule first.");
            return;
        }
        exportSchedule(currentCourseHolders);
    });

    console.log("Completed JS initialization!")
}

main().then(_ => {
}).catch(err => {
    console.error("Error during main execution:", err);
});