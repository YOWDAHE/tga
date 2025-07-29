import { Loader } from "@mantine/core";
import React from "react";

function loading() {
	return (
		<div style={{ position: "absolute", inset: 0, display: "flex", justifyContent: "center", alignItems: "center" }}>
			<Loader color="teal" />
		</div>
	);
}

export default loading;
