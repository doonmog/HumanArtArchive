<template>
  <header class="w-full p-4 bg-white shadow-sm">
    <div class="container mx-auto">
      <nav class="flex flex-row items-center justify-between">
        <NuxtLink to="/" class="text-lg font-semibold text-gray-800 hover:text-gray-600">
          Human Art Archive
        </NuxtLink>
        
        <div class="mx-4 flex-grow max-w-md">
          <Search />
        </div>
        
        <div class="flex gap-4">
          <NuxtLink to="/help" class="text-gray-600 hover:text-gray-800">
            Help
          </NuxtLink>
          <NuxtLink to="/advanced" class="text-gray-600 hover:text-gray-800">
            Advanced Search
          </NuxtLink>
          <NuxtLink to="/about" class="text-gray-600 hover:text-gray-800">
            About
          </NuxtLink>
        </div>
      </nav>
    </div>
  </header>
</template>