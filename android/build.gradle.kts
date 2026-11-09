plugins { id("com.android.application") }

android {
    namespace = "de.adohadesign.stromblick"
    compileSdk = 35
    defaultConfig {
        applicationId = "de.adohadesign.stromblick"
        minSdk = 26
        targetSdk = 35
        versionCode = 130
        versionName = "1.3.0"
    }
    buildTypes {
        getByName("release") {
            isMinifyEnabled = false
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

dependencies {
    implementation("androidx.webkit:webkit:1.12.1")
    implementation("androidx.core:core:1.15.0")
}

val syncAppAssets by tasks.registering(Exec::class) {
    workingDir(rootProject.projectDir)
    commandLine("node", "scripts/prepare-android.mjs")
    inputs.files(
        rootProject.file("index.html"), rootProject.file("app.mjs"),
        rootProject.file("calculations.mjs"), rootProject.file("storage.mjs"),
        rootProject.file("styles.css"), rootProject.file("manifest.webmanifest"),
        rootProject.file("service-worker.js"), rootProject.file("scripts/prepare-android.mjs")
    )
    inputs.dir(rootProject.file("icons"))
    outputs.dir(layout.projectDirectory.dir("src/main/assets/www"))
}

tasks.named("preBuild") { dependsOn(syncAppAssets) }
