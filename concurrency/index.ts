import { Worker, isMainThread, workerData, } from "worker_threads"

if (isMainThread) {
	const sharedBuffer = new SharedArrayBuffer(4)
	const counter = new Int32Array(sharedBuffer)

	const worker1 = new Worker(__filename, { workerData: { counter } })
	const worker2 = new Worker(__filename, { workerData: { counter } })

	let finished = 0;

	worker1.on("exit", () => {
		finished++;
		if (finished == 2) {
			console.log('final ', counter[0])
		}
	})
	worker2.on("exit", () => {
		finished++;
		if (finished == 2) {
			console.log('final ', counter[0])
		}
	})
} else {
	const { counter } = workerData;
	for (let i = 0; i < 1000000; i++) {
		counter[0]++;
		//for removing race condition
		//Atomics.add(counter, 0, 1) 
	}
}
